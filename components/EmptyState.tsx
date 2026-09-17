'use client'

interface Props {
  nightMode: boolean
  onUpload: (files: FileList) => void
}

export default function EmptyState({ nightMode, onUpload }: Props) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) onUpload(e.dataTransfer.files)
  }
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  return (
    <div
      className="canvas-empty-state-overlay"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="canvas-empty-state" data-night={nightMode ? 'true' : 'false'}>
        <div className="canvas-empty-state-icon">
          <span className="material-symbols-outlined">photo_library</span>
        </div>
        <p className="canvas-empty-state-text">
          Drop photos or use Upload in the panel
        </p>
      </div>
    </div>
  )
}
