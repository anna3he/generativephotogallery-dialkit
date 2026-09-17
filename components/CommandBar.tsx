'use client'

import { useRef, useCallback } from 'react'
import ShapePreviewCanvas from './ShapePreviewCanvas'
import DialKnob from './DialKnob'
import type { ShapeType } from '@/lib/layouts'
import { getColors } from '@/lib/tokens'

export interface DialParams {
  count: number
  spread: number
  size: number
  radius: number
  speed: number
}

interface Props {
  open: boolean
  shape: ShapeType
  params: DialParams
  nightMode: boolean
  focusedDial: keyof DialParams | null
  imageCount: number
  onShapeChange: (s: ShapeType) => void
  onParamChange: (k: keyof DialParams, v: number) => void
  onFocusDial: (k: keyof DialParams | null) => void
  onUpload: (files: FileList) => void
  onNightModeToggle: () => void
  onExport: () => void
  onManagePhotos: () => void
  onResetPhotos: () => void
}

const SHAPES: { id: ShapeType; label: string }[] = [
  { id: 'spiral', label: 'Spiral' },
  { id: 'orbit',  label: 'Orbit'  },
  { id: 'globe',  label: 'Globe'  },
  { id: 'cube',   label: 'Cube'   },
]

const DIALS: {
  key: keyof DialParams
  label: string
  min: number
  max: number
  step: number
}[] = [
  { key: 'count',  label: 'Count',  min: 1,   max: 75,  step: 1   },
  { key: 'spread', label: 'Spread', min: 0.2,  max: 5,   step: 0.1 },
  { key: 'size',   label: 'Size',   min: 0.3,  max: 3,   step: 0.1 },
  { key: 'radius', label: 'Radius', min: 0,    max: 24,  step: 1   },
  { key: 'speed',  label: 'Speed',  min: 0,    max: 3,   step: 0.1 },
]

export default function CommandBar({
  open, shape, params, nightMode, focusedDial, imageCount,
  onShapeChange, onParamChange, onFocusDial, onUpload,
  onNightModeToggle, onExport, onManagePhotos, onResetPhotos,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) onUpload(e.target.files)
      e.target.value = ''
    },
    [onUpload]
  )

  const c     = getColors(nightMode)
  const bg    = nightMode ? 'rgba(37,37,37,0.97)'   : 'rgba(249,249,249,0.97)'
  const btnBg = nightMode ? c.bg3                  : c.bg3
  const btnFg = nightMode ? c.t2                   : c.t2

  return (
    <>
      <div
        className="fixed left-1/2 z-50"
        style={{
          bottom: 'var(--s6)',
          transform: `translateX(-50%) translateY(${open ? '0' : '12px'})`,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease',
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="flex items-center rounded-2xl"
          style={{
            gap: 'var(--s8)',
            padding: 'var(--s4) var(--s8)',
            background: bg,
            border: `1px solid ${c.line}`,
            boxShadow: nightMode ? 'none' : '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Shapes */}
          <div className="flex items-center" style={{ gap: 'var(--s3)' }}>
            {SHAPES.map((s) => (
              <ShapePreviewCanvas
                key={s.id}
                shape={s.id}
                active={shape === s.id}
                nightMode={nightMode}
                onClick={() => onShapeChange(s.id)}
                label={s.label}
              />
            ))}
          </div>

          <div className="self-stretch w-px" style={{ background: c.line }} />

          {/* Dials */}
          <div className="flex items-end" style={{ gap: 'var(--s4)' }}>
            {DIALS.map((d) => (
              <DialKnob
                key={d.key}
                label={d.label}
                value={params[d.key]}
                min={d.min}
                max={d.max}
                step={d.step}
                focused={focusedDial === d.key}
                onFocus={() => onFocusDial(d.key)}
                onChange={(v) => onParamChange(d.key, v)}
                nightMode={nightMode}
              />
            ))}
          </div>

          <div className="self-stretch w-px" style={{ background: c.line }} />

          {/* Actions */}
          <div className="flex flex-col items-center" style={{ gap: 'var(--s2)' }}>
            <div className="flex" style={{ gap: 'var(--s2)' }}>
              {/* Upload */}
              <button
                onClick={() => fileRef.current?.click()}
                title="Upload photos"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: btnBg, color: btnFg }}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 20" }}>upload</span>
              </button>

              {/* Dark / light mode */}
              <button
                onClick={onNightModeToggle}
                title={nightMode ? 'Light mode' : 'Night mode'}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: btnBg, color: btnFg }}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 20" }}>
                  {nightMode ? 'light_mode' : 'dark_mode'}
                </span>
              </button>

              {/* Export */}
              <button
                onClick={onExport}
                title="Export PNG"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: btnBg, color: btnFg }}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 20" }}>download</span>
              </button>
            </div>

            {/* Photo count — Label role (ALL CAPS overline) + close */}
            <div className="flex items-center" style={{ gap: 'var(--s1)' }}>
              <button
                onClick={imageCount > 0 ? onManagePhotos : undefined}
                className="type-label transition-colors flex items-center"
                style={{
                  gap: 4,
                  color: imageCount > 0 ? c.t3 : c.t4,
                  cursor: imageCount > 0 ? 'pointer' : 'default',
                }}
                disabled={imageCount === 0}
              >
                {imageCount > 0 ? `${imageCount} photo${imageCount !== 1 ? 's' : ''}` : 'No photos'}
              </button>
              {imageCount > 0 && (
                <button
                  onClick={onResetPhotos}
                  title="Remove all photos"
                  style={{ color: c.t4, lineHeight: 1, display: 'flex' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  )
}
