'use client'

import { useState } from 'react'

interface Props {
  open: boolean
  images: HTMLImageElement[]
  onClose: () => void
  onDelete: (indices: number[]) => void
  onReset: () => void
}

export default function PhotoManageModal({
  open,
  images,
  onClose,
  onDelete,
  onReset,
}: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set())

  if (!open) return null

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleDeleteSelected = () => {
    if (selected.size > 0) {
      onDelete(Array.from(selected))
      setSelected(new Set())
    }
  }

  const handleReset = () => {
    onReset()
    setSelected(new Set())
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center dialkit-modal-overlay"
      onClick={onClose}
    >
      <div className="dialkit-modal-backdrop" />

      <div
        className="dialkit-modal relative w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialkit-modal-header">
          <h2 className="dialkit-modal-title">
            Manage Photos
            <span className="dialkit-modal-count">{images.length}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="dialkit-modal-icon-btn"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="dialkit-modal-body">
          {images.length === 0 ? (
            <p className="dialkit-modal-empty">No photos uploaded</p>
          ) : (
            <div className="dialkit-modal-grid">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleSelect(i)}
                  className={`dialkit-modal-thumb${selected.has(i) ? ' is-selected' : ''}`}
                  aria-pressed={selected.has(i)}
                  aria-label={`Photo ${i + 1}`}
                >
                  <img src={img.src} alt="" className="dialkit-modal-thumb-img" />
                  {selected.has(i) && (
                    <span className="dialkit-modal-thumb-check material-symbols-outlined">
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="dialkit-modal-footer">
          <button type="button" onClick={handleReset} className="dialkit-modal-btn">
            Remove All
          </button>

          <div className="dialkit-modal-footer-actions">
            {selected.size > 0 && (
              <span className="dialkit-modal-meta">{selected.size} selected</span>
            )}
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selected.size === 0}
              className="dialkit-modal-btn dialkit-modal-btn-destructive"
            >
              Delete Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
