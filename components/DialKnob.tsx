'use client'

import { useRef, useCallback, useEffect } from 'react'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step: number
  focused: boolean
  onFocus: () => void
  onChange: (v: number) => void
  nightMode: boolean
}

export default function DialKnob({
  label,
  value,
  min,
  max,
  step,
  focused,
  onFocus,
  onChange,
  nightMode,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number | null>(null)
  const dragStartVal = useRef(value)

  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const round = (v: number) => Math.round(v / step) * step
  const norm = (v: number) => (v - min) / (max - min)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onFocus()
      dragStartY.current = e.clientY
      dragStartVal.current = value

      const onMove = (me: MouseEvent) => {
        if (dragStartY.current === null) return
        const delta = (dragStartY.current - me.clientY) / 120
        const newVal = clamp(round(dragStartVal.current + delta * (max - min)))
        onChange(newVal)
      }
      const onUp = () => {
        dragStartY.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [value, min, max, step, onChange, onFocus]
  )

  // Touch drag
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      onFocus()
      dragStartY.current = e.touches[0].clientY
      dragStartVal.current = value
    },
    [value, onFocus]
  )
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (dragStartY.current === null) return
      const delta = (dragStartY.current - e.touches[0].clientY) / 120
      const newVal = clamp(round(dragStartVal.current + delta * (max - min)))
      onChange(newVal)
    },
    [value, min, max, step, onChange]
  )

  // Keyboard when focused
  useEffect(() => {
    if (!focused) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        onChange(clamp(round(value + step)))
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        onChange(clamp(round(value - step)))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focused, value, step, min, max, onChange])

  const pct = norm(value) * 100

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onFocus={onFocus}
      className="flex flex-col items-center cursor-ns-resize outline-none select-none"
      style={{ gap: 'var(--s3)' }}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={label}
    >
      {/* Arc indicator */}
      <div
        className="relative w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: nightMode ? '#252525' : '#EBEBEB',
          boxShadow: focused
            ? `0 0 0 2px ${nightMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'}`
            : 'none',
          transition: 'box-shadow 0.15s',
        }}
      >
        {/* Track arc */}
        <svg width="40" height="40" className="absolute inset-0" style={{ rotate: '-210deg' }}>
          <circle
            cx="20"
            cy="20"
            r="14"
            fill="none"
            stroke={nightMode ? '#383838' : '#D4D4D4'}
            strokeWidth="2.5"
            strokeDasharray={`${(300 / 360) * Math.PI * 2 * 14} ${Math.PI * 2 * 14}`}
            strokeLinecap="round"
          />
          <circle
            cx="20"
            cy="20"
            r="14"
            fill="none"
            stroke={focused ? (nightMode ? '#ffffff' : '#1a1a1a') : nightMode ? '#666' : '#555'}
            strokeWidth="2.5"
            strokeDasharray={`${((pct / 100) * 300 / 360) * Math.PI * 2 * 14} ${Math.PI * 2 * 14}`}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.15s' }}
          />
        </svg>
        <span
          className="tabular-nums z-10"
          style={{
            fontSize: 'var(--type-label-size)',
            lineHeight: 'var(--type-label-lh)',
            letterSpacing: '-0.01em',
            fontWeight: 400,
            color: nightMode ? '#CCCCCC' : '#444444',
          }}
        >
          {Number.isInteger(step) ? Math.round(value) : value.toFixed(1)}
        </span>
      </div>
      <span
        className="type-label"
        style={{
          color: nightMode ? '#777777' : '#AAAAAA',
        }}
      >
        {label}
      </span>
    </div>
  )
}
