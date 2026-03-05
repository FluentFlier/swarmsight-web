import { useState, useCallback } from 'react'
import { Crosshair, Check, X } from 'lucide-react'

export interface Correction {
  frame: number
  tipType: 'left_tip' | 'right_tip' | 'proboscis_tip'
  x: number
  y: number
}

interface AnnotationEditorProps {
  currentFrame: number
  corrections: Record<string, Record<string, { x: number; y: number }>>
  onAddCorrection: (correction: Correction) => void
  onRemoveCorrection: (frame: number, tipType: string) => void
}

export function AnnotationEditor({
  currentFrame,
  corrections,
  onAddCorrection,
  onRemoveCorrection,
}: AnnotationEditorProps) {
  const [isActive, setIsActive] = useState(false)
  const [pendingClick, setPendingClick] = useState<{ x: number; y: number } | null>(null)

  const frameCorrections = corrections[currentFrame.toString()] || {}
  const hasCorrections = Object.keys(frameCorrections).length > 0

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isActive) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 200 // standard space
      const y = ((e.clientY - rect.top) / rect.height) * 200
      setPendingClick({ x, y })
    },
    [isActive]
  )

  const confirmCorrection = (tipType: 'left_tip' | 'right_tip' | 'proboscis_tip') => {
    if (!pendingClick) return
    onAddCorrection({
      frame: currentFrame,
      tipType,
      x: pendingClick.x,
      y: pendingClick.y,
    })
    setPendingClick(null)
    setIsActive(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium">Manual Corrections</label>
        <button
          onClick={() => {
            setIsActive(!isActive)
            setPendingClick(null)
          }}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
            isActive
              ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]'
              : 'bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)]'
          }`}
        >
          <Crosshair className="w-3 h-3" />
          {isActive ? 'Cancel' : 'Correct (C)'}
        </button>
      </div>

      {isActive && (
        <p className="text-[10px] text-[var(--color-warning)]">
          Click on the correct tip position in the video, then select which tip to correct.
        </p>
      )}

      {pendingClick && (
        <div className="flex flex-col gap-1 p-2 rounded bg-[var(--color-surface-overlay)]">
          <p className="text-[10px] text-[var(--color-text-muted)]">
            Position: ({pendingClick.x.toFixed(1)}, {pendingClick.y.toFixed(1)})
          </p>
          <div className="flex gap-1">
            {(['left_tip', 'right_tip', 'proboscis_tip'] as const).map((type) => (
              <button
                key={type}
                onClick={() => confirmCorrection(type)}
                className="flex-1 px-1 py-1 text-[10px] rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                {type === 'left_tip' ? 'Left' : type === 'right_tip' ? 'Right' : 'Proboscis'}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasCorrections && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[var(--color-text-muted)]">Frame {currentFrame}:</span>
          {Object.entries(frameCorrections).map(([key, pos]) => (
            <div key={key} className="flex items-center justify-between px-2 py-0.5 rounded bg-[var(--color-surface-overlay)]">
              <span className="text-[10px] font-mono text-[var(--color-warning)]">
                {key}: ({pos.x.toFixed(1)}, {pos.y.toFixed(1)})
              </span>
              <button
                onClick={() => onRemoveCorrection(currentFrame, key)}
                className="p-0.5 rounded hover:bg-[var(--color-border)]"
              >
                <X className="w-2.5 h-2.5 text-[var(--color-error)]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
