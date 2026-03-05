import { useState, useCallback, useRef } from 'react'
import { useMotionStore } from '../../stores/motionStore'
import { Maximize2, RotateCcw } from 'lucide-react'

export function ROISelector() {
  const roi = useMotionStore((s) => s.roi)
  const setRoi = useMotionStore((s) => s.setRoi)

  const isFullFrame = roi.leftPct === 0 && roi.topPct === 0 && roi.rightPct === 1 && roi.bottomPct === 1

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium">Region of Interest</label>
        {!isFullFrame && (
          <button
            onClick={() => setRoi({ leftPct: 0, topPct: 0, rightPct: 1, bottomPct: 1 })}
            className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded
              bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Reset
          </button>
        )}
      </div>

      <ROIPreview roi={roi} onRoiChange={setRoi} />

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[10px] text-[var(--color-text-muted)]">Left %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(roi.leftPct * 100)}
            onChange={(e) => setRoi({ ...roi, leftPct: parseInt(e.target.value) / 100 })}
            className="w-full mt-0.5 px-2 py-1 text-xs bg-[var(--color-surface-overlay)] border border-[var(--color-border)]
              rounded focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="text-[10px] text-[var(--color-text-muted)]">Top %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(roi.topPct * 100)}
            onChange={(e) => setRoi({ ...roi, topPct: parseInt(e.target.value) / 100 })}
            className="w-full mt-0.5 px-2 py-1 text-xs bg-[var(--color-surface-overlay)] border border-[var(--color-border)]
              rounded focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="text-[10px] text-[var(--color-text-muted)]">Right %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(roi.rightPct * 100)}
            onChange={(e) => setRoi({ ...roi, rightPct: parseInt(e.target.value) / 100 })}
            className="w-full mt-0.5 px-2 py-1 text-xs bg-[var(--color-surface-overlay)] border border-[var(--color-border)]
              rounded focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="text-[10px] text-[var(--color-text-muted)]">Bottom %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(roi.bottomPct * 100)}
            onChange={(e) => setRoi({ ...roi, bottomPct: parseInt(e.target.value) / 100 })}
            className="w-full mt-0.5 px-2 py-1 text-xs bg-[var(--color-surface-overlay)] border border-[var(--color-border)]
              rounded focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      </div>
    </div>
  )
}

interface ROIPreviewProps {
  roi: { leftPct: number; topPct: number; rightPct: number; bottomPct: number }
  onRoiChange: (roi: { leftPct: number; topPct: number; rightPct: number; bottomPct: number }) => void
}

function ROIPreview({ roi, onRoiChange }: ROIPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setIsDragging(true)
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    dragStart.current = { x, y }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
      const sx = dragStart.current.x
      const sy = dragStart.current.y
      onRoiChange({
        leftPct: Math.min(sx, x),
        topPct: Math.min(sy, y),
        rightPct: Math.max(sx, x),
        bottomPct: Math.max(sy, y),
      })
    },
    [isDragging, onRoiChange]
  )

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full aspect-video bg-[var(--color-surface)] border border-[var(--color-border)]
        rounded cursor-crosshair select-none"
    >
      {/* ROI highlight */}
      <div
        className="absolute border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/10 rounded-sm"
        style={{
          left: `${roi.leftPct * 100}%`,
          top: `${roi.topPct * 100}%`,
          width: `${(roi.rightPct - roi.leftPct) * 100}%`,
          height: `${(roi.bottomPct - roi.topPct) * 100}%`,
        }}
      />
      {/* Dimmed areas outside ROI */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bg-black/40" style={{ left: 0, top: 0, right: 0, height: `${roi.topPct * 100}%` }} />
        <div className="absolute bg-black/40" style={{ left: 0, bottom: 0, right: 0, height: `${(1 - roi.bottomPct) * 100}%` }} />
        <div className="absolute bg-black/40" style={{ left: 0, top: `${roi.topPct * 100}%`, width: `${roi.leftPct * 100}%`, height: `${(roi.bottomPct - roi.topPct) * 100}%` }} />
        <div className="absolute bg-black/40" style={{ right: 0, top: `${roi.topPct * 100}%`, width: `${(1 - roi.rightPct) * 100}%`, height: `${(roi.bottomPct - roi.topPct) * 100}%` }} />
      </div>
      <div className="absolute bottom-1 right-1 flex items-center gap-0.5 text-[9px] text-[var(--color-text-muted)]">
        <Maximize2 className="w-2.5 h-2.5" />
        Drag to select
      </div>
    </div>
  )
}
