import { useMotionStore } from '../../stores/motionStore'
import { Eye, EyeOff } from 'lucide-react'

export function SensitivityPanel() {
  const threshold = useMotionStore((s) => s.threshold)
  const showMotion = useMotionStore((s) => s.showMotion)
  const setThreshold = useMotionStore((s) => s.setThreshold)
  const setShowMotion = useMotionStore((s) => s.setShowMotion)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium">Sensitivity</label>
        <button
          onClick={() => setShowMotion(!showMotion)}
          className="p-1 rounded hover:bg-[var(--color-surface-overlay)] transition-colors"
          title={showMotion ? 'Hide motion overlay' : 'Show motion overlay'}
        >
          {showMotion ? (
            <Eye className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          )}
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>Threshold</span>
          <span className="font-mono">{threshold}</span>
        </div>
        <input
          type="range"
          min={1}
          max={255}
          value={threshold}
          onChange={(e) => setThreshold(parseInt(e.target.value))}
          className="w-full h-1.5 appearance-none bg-[var(--color-border)] rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:bg-[var(--color-accent)] [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
          <span>More sensitive</span>
          <span>Less sensitive</span>
        </div>
      </div>
    </div>
  )
}
