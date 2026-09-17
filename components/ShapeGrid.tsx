'use client'

import ShapePreviewCanvas from './ShapePreviewCanvas'
import type { ShapeType } from '@/lib/layouts'

const SHAPES: { id: ShapeType; label: string }[] = [
  { id: 'spiral', label: 'Spiral' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'globe', label: 'Globe' },
  { id: 'cube', label: 'Cube' },
]

interface Props {
  shape: ShapeType
  nightMode: boolean
  onShapeChange: (shape: ShapeType) => void
  embedded?: boolean
}

export default function ShapeGrid({ shape, nightMode, onShapeChange, embedded = false }: Props) {
  return (
    <div
      className={embedded ? 'dialkit-shape-grid' : 'fixed z-40 rounded-2xl'}
      style={
        embedded
          ? { paddingBottom: 'var(--s2)' }
          : {
              top: 'var(--s6)',
              left: 'var(--s6)',
              padding: 'var(--s4)',
              background: nightMode ? 'rgba(17,17,17,0.92)' : 'rgba(249,249,249,0.92)',
              border: `1px solid ${nightMode ? '#383838' : '#E8E8E8'}`,
              boxShadow: nightMode ? 'none' : '0 4px 16px rgba(0,0,0,0.08)',
              backdropFilter: 'blur(20px)',
            }
      }
    >
      <div
        className={embedded ? 'grid grid-cols-4' : 'grid grid-cols-2'}
        style={{
          gap: embedded ? 'var(--s2)' : 'var(--s4)',
          justifyItems: 'center',
          alignItems: 'start',
        }}
      >
        {SHAPES.map((s) => (
          <ShapePreviewCanvas
            key={s.id}
            shape={s.id}
            active={shape === s.id}
            nightMode={nightMode}
            onClick={() => onShapeChange(s.id)}
            label={s.label}
            size={embedded ? 36 : 44}
            theme={embedded ? 'dialkit' : 'app'}
          />
        ))}
      </div>
    </div>
  )
}
