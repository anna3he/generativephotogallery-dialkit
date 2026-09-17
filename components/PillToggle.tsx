'use client'

import { getColors } from '@/lib/tokens'

interface Props {
  open: boolean
  onToggle: () => void
  nightMode: boolean
}

export default function PillToggle({ open, onToggle, nightMode }: Props) {
  const c     = getColors(nightMode)
  const bg    = nightMode ? 'rgba(17,17,17,0.92)'    : 'rgba(249,249,249,0.92)'
  const keyBg = nightMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'

  return (
    <button
      onClick={onToggle}
      aria-label={open ? 'Close command bar' : 'Open command bar (Space)'}
      className="fixed z-40 transition-all duration-200"
      style={{
        bottom: 'var(--s6)',
        left: '50%',
        transform: `translateX(-50%) translateY(${open ? '8px' : '0px'})`,
        opacity: open ? 0 : 1,
        pointerEvents: open ? 'none' : 'all',
      }}
    >
      <div
        className="flex items-center rounded-full"
        style={{
          gap: 'var(--s2)',
          padding: 'var(--s2) var(--s3)',
          background: bg,
          border: `1px solid ${c.line}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
          backdropFilter: 'blur(12px)',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          className="type-label flex items-center justify-center rounded font-mono"
          style={{
            padding: '2px var(--s2) 3px',
            background: keyBg,
            color: c.t4,
            border: `1px solid ${c.line}`,
            fontWeight: nightMode ? 500 : 400,
            textTransform: 'none',
            letterSpacing: '0.08em',
          }}
        >
          space
        </span>
        <span
          className="type-label"
          style={{
            color: c.t4,
            fontWeight: nightMode ? 500 : 400,
            textTransform: 'none',
          }}
        >
          To open
        </span>
      </div>
    </button>
  )
}
