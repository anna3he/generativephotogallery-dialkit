'use client'

import { useEffect, useRef } from 'react'
import { drawShapePreview, type PreviewTheme } from '@/lib/shapePreview'

interface Props {
  shape: Parameters<typeof drawShapePreview>[1]
  active: boolean
  nightMode: boolean
  onClick: () => void
  label: string
  size?: number
  theme?: PreviewTheme
}

export default function ShapePreviewCanvas({
  shape,
  active,
  nightMode,
  onClick,
  label,
  size = 44,
  theme = 'app',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    drawShapePreview(canvas, shape, nightMode, dpr, size, theme)
  }, [shape, nightMode, size, theme])

  const panelDark = theme === 'dialkit' ? nightMode : nightMode

  const labelColor = panelDark
    ? active
      ? 'rgba(255, 255, 255, 0.88)'
      : 'rgba(255, 255, 255, 0.52)'
    : active
      ? 'rgba(0, 0, 0, 0.82)'
      : 'rgba(0, 0, 0, 0.45)'

  const activeBorder = panelDark
    ? '2px solid rgba(255, 255, 255, 0.42)'
    : '2px solid rgba(0, 0, 0, 0.28)'

  return (
    <button
      onClick={onClick}
      title={label}
      className="relative flex flex-col items-center justify-center w-full"
      style={{ gap: 'var(--s2)' }}
      aria-pressed={active}
      aria-label={label}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          display: 'block',
          width: size,
          height: size,
          borderRadius: 8,
          border: active ? activeBorder : '2px solid transparent',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
      />
      <span
        className="type-label transition-colors text-center w-full"
        style={{ color: labelColor, fontSize: 10, lineHeight: 1.1 }}
      >
        {label}
      </span>
    </button>
  )
}
