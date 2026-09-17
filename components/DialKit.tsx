'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { DialRoot, useDialKit, useDialKitController } from 'dialkit'
import 'dialkit/styles.css'
import { computeLayout, type ShapeType, type Tile } from '@/lib/layouts'
import type { LayoutParams } from '@/lib/layout-params'
import { render as renderCanvas } from '@/lib/renderer'
import { loadDefaultPhotos } from '@/lib/defaultPhotos'
import {
  DIAL_PERSIST,
  LAYOUT_DIAL_STEPS,
  layoutDialConfig,
  photosDialConfig,
  shapeDialConfig,
} from '@/lib/dialkit-controls'
import { useDialKitSectionHost } from '@/hooks/useDialKitSectionHost'
import ShapeGrid from './ShapeGrid'
import EmptyState from './EmptyState'
import PhotoManageModal from './PhotoManageModal'

const MAX_IMAGES = 75

const SLIDER_LABEL_TO_KEY: Record<string, keyof LayoutParams> = {
  Count: 'count',
  Spread: 'spread',
  Size: 'size',
  Radius: 'radius',
  Speed: 'speed',
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function buildSeededLayout(shape: ShapeType, params: LayoutParams, seed: number): Tile[] {
  let idx = 0
  const origRand = Math.random
  Math.random = () => seededRandom(seed + idx++)
  const tiles = computeLayout(shape, params)
  Math.random = origRand
  return tiles
}

const SHAPE_DEFAULTS: Record<ShapeType, Partial<LayoutParams>> = {
  spiral: { count: 12, spread: 1.0, size: 1.0 },
  orbit: { count: 23, spread: 3.5, size: 0.6 },
  globe: { count: 50, spread: 0.55, size: 0.7 },
  cube: { count: 27, spread: 1.2, size: 1.0 },
}

export default function PhotoGalleryApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const animRef = useRef<number>(0)
  const exportRef = useRef<() => void>(() => {})
  const resetPhotosRef = useRef<() => void>(() => {})

  const [images, setImages] = useState<HTMLImageElement[]>([])
  const [photosReady, setPhotosReady] = useState(false)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [rotationX, setRotationX] = useState(0)
  const [rotationY, setRotationY] = useState(0)
  const [shape, setShape] = useState<ShapeType>('spiral')
  const [layoutSeed, setLayoutSeed] = useState(42)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [hintHidden, setHintHidden] = useState(false)
  const handleShapeChangeRef = useRef<(s: ShapeType) => void>(() => {})

  useDialKit('Shape', shapeDialConfig, {
    id: 'pg-shape-v3',
    persist: false,
    onAction: (path) => {
      if (path === 'spiral' || path === 'orbit' || path === 'globe' || path === 'cube') {
        handleShapeChangeRef.current(path)
      }
    },
  })

  const layout = useDialKit('Layout', layoutDialConfig, {
    id: 'pg-layout-v4',
    persist: DIAL_PERSIST,
  })

  const layoutController = useDialKitController('Layout', layoutDialConfig, {
    id: 'pg-layout-v4',
  })

  const photos = useDialKit('Photos', photosDialConfig, {
    id: 'pg-photos-v3',
    persist: DIAL_PERSIST,
    onAction: (path) => {
      if (path === 'upload') fileInputRef.current?.click()
      if (path === 'manage') setPhotoModalOpen(true)
      if (path === 'exportPng') exportRef.current()
    },
  })

  const shapeHost = useDialKitSectionHost('Shape')

  const nightMode = photos.nightMode

  const params: LayoutParams = {
    count: layout.count,
    spread: layout.spread,
    size: layout.size,
    radius: layout.radius,
    speed: layout.speed,
  }

  const tiles = useMemo(
    () => buildSeededLayout(shape, params, layoutSeed),
    [shape, params, layoutSeed],
  )

  const refreshSeed = useCallback(() => setLayoutSeed((s) => s + 1), [])

  useEffect(() => {
    let cancelled = false
    loadDefaultPhotos().then((loaded) => {
      if (cancelled) return
      if (loaded.length > 0) setImages(loaded)
      setPhotosReady(true)
    })
    return () => { cancelled = true }
  }, [])

  const handleShapeChange = useCallback(
    (next: ShapeType) => {
      setShape(next)
      layoutController.setValues({
        radius: layout.radius,
        speed: layout.speed,
        ...SHAPE_DEFAULTS[next],
      })
      refreshSeed()
    },
    [layout.radius, layout.speed, layoutController, refreshSeed],
  )

  handleShapeChangeRef.current = handleShapeChange

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const wrapper = (e.target as HTMLElement).closest('.dialkit-slider-wrapper')
      if (!wrapper?.closest('.dialkit-root')) return

      const labelNode = wrapper.querySelector('.dialkit-slider-label')
      const labelText = labelNode?.childNodes[0]?.textContent?.trim() ?? ''
      const key = SLIDER_LABEL_TO_KEY[labelText]
      if (!key) return

      e.preventDefault()
      e.stopPropagation()

      const cfg = LAYOUT_DIAL_STEPS[key]
      const dir = e.deltaY > 0 ? -1 : 1
      const raw = layout[key] + dir * cfg.step
      const clamped = Math.min(cfg.max, Math.max(cfg.min, raw))
      const stepped = Math.round(clamped / cfg.step) * cfg.step
      layoutController.setValue(key, stepped)
    }

    window.addEventListener('wheel', onWheel, { passive: false, capture: true })
    return () => window.removeEventListener('wheel', onWheel, { capture: true })
  }, [layout, layoutController])

  useEffect(() => {
    const tagPhotoButtons = () => {
      document.querySelectorAll('.dialkit-folder-section').forEach((section) => {
        const title = section.querySelector('.dialkit-folder-title')?.textContent?.trim()
        if (title !== 'Photos') return

        section.querySelectorAll('.dialkit-button').forEach((btn) => {
          const text = btn.textContent?.trim() ?? ''
          if (text.includes('Upload')) btn.setAttribute('data-icon', 'upload')
          else if (text.includes('Manage')) btn.setAttribute('data-icon', 'photo_library')
          else if (text.includes('Export')) btn.setAttribute('data-icon', 'download')
          else btn.removeAttribute('data-icon')
        })
      })
    }

    tagPhotoButtons()
    const observer = new MutationObserver(tagPhotoButtons)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  const handleUpload = useCallback((files: FileList) => {
    const arr = Array.from(files).slice(0, MAX_IMAGES)
    setImages((prev) => {
      const remaining = MAX_IMAGES - prev.length
      const newImgs = arr.slice(0, remaining).map((file) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = URL.createObjectURL(file)
        return img
      })
      return [...prev, ...newImgs]
    })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files)
    },
    [handleUpload],
  )

  const isDragging = useRef(false)
  const dragMode = useRef<'rotate' | 'pan'>('rotate')
  const lastPointer = useRef({ x: 0, y: 0 })
  const lastTouchDist = useRef<number | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    dragMode.current = e.shiftKey ? 'pan' : 'rotate'
    lastPointer.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastPointer.current.x
    const dy = e.clientY - lastPointer.current.y
    lastPointer.current = { x: e.clientX, y: e.clientY }

    if (dragMode.current === 'rotate') {
      setRotationY((r) => r + dx * 0.008)
      setRotationX((r) => r - dy * 0.008)
    } else {
      setPanX((p) => p + dx)
      setPanY((p) => p + dy)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.93 : 1.075
    setZoom((z) => Math.min(8, Math.max(0.08, z * factor)))
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy)
    } else {
      isDragging.current = true
      dragMode.current = 'rotate'
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      setZoom((z) => Math.min(8, Math.max(0.08, z * (dist / lastTouchDist.current!))))
      lastTouchDist.current = dist
    } else if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastPointer.current.x
      const dy = e.touches[0].clientY - lastPointer.current.y
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setRotationY((r) => r + dx * 0.008)
      setRotationX((r) => r - dy * 0.008)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    lastTouchDist.current = null
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)
    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const loop = (ts: number) => {
      const dpr = window.devicePixelRatio || 1
      renderCanvas({
        canvas,
        images,
        tiles,
        panX: panX * dpr,
        panY: panY * dpr,
        zoom,
        nightMode,
        tileSize: 120 * dpr,
        animOffset: ts,
        speed: params.speed,
        shape,
        spread: params.spread,
        radius: params.radius,
        rotationX,
        rotationY,
      })
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [
    images,
    tiles,
    panX,
    panY,
    zoom,
    nightMode,
    params.speed,
    params.spread,
    params.radius,
    shape,
    rotationX,
    rotationY,
  ])

  const exportScreenshot = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || images.length === 0) return

    setHintHidden(true)
    requestAnimationFrame(() => {
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `gallery-${shape}-${Date.now()}.png`
      a.click()
      setHintHidden(false)
    })
  }, [images.length, shape])

  exportRef.current = exportScreenshot

  const deletePhotos = useCallback((indices: number[]) => {
    setImages((prev) => prev.filter((_, i) => !indices.includes(i)))
  }, [])

  const resetPhotos = useCallback(() => {
    setImages([])
  }, [])

  resetPhotosRef.current = resetPhotos

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: nightMode ? '#111111' : '#F9F9F9' }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ display: 'block' }}
      />

      {photosReady && images.length === 0 && (
        <EmptyState nightMode={nightMode} onUpload={handleUpload} />
      )}

      {shapeHost &&
        createPortal(
          <ShapeGrid
            embedded
            shape={shape}
            nightMode={nightMode}
            onShapeChange={handleShapeChange}
          />,
          shapeHost,
        )}

      <p
        className={`canvas-hint-bar${hintHidden ? ' is-hidden' : ''}`}
        data-night={nightMode ? 'true' : 'false'}
      >
        Drag to rotate · Shift+drag to pan · Scroll to zoom
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleUpload(e.target.files)
          e.target.value = ''
        }}
      />

      <PhotoManageModal
        open={photoModalOpen}
        images={images}
        onClose={() => setPhotoModalOpen(false)}
        onDelete={deletePhotos}
        onReset={resetPhotos}
      />

      <DialRoot position="top-right" theme="system" defaultOpen productionEnabled />
    </div>
  )
}
