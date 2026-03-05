import { useRef, useCallback } from 'react'
import { Download, Upload, Play, Trash2 } from 'lucide-react'
import { SensitivityPanel } from './SensitivityPanel'
import { ROISelector } from './ROISelector'
import { useMotionStore } from '../../stores/motionStore'
import { useVideoStore } from '../../stores/videoStore'
import { motionDataToCSV, parseMotionCSV, downloadCSV } from '../../lib/csvParser'

export function MotionControls() {
  const motionData = useMotionStore((s) => s.motionData)
  const isProcessing = useMotionStore((s) => s.isProcessing)
  const clearMotionData = useMotionStore((s) => s.clearMotionData)
  const setMotionData = useMotionStore((s) => s.setMotionData)
  const setProcessing = useMotionStore((s) => s.setProcessing)
  const video = useVideoStore((s) => s.video)
  const importRef = useRef<HTMLInputElement>(null)

  const handleExportCSV = useCallback(() => {
    if (motionData.length === 0) return
    const csv = motionDataToCSV(motionData)
    const name = video?.fileName?.replace(/\.[^.]+$/, '') || 'motion'
    downloadCSV(csv, `${name}_motion.csv`)
  }, [motionData, video])

  const handleImportCSV = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const text = await file.text()
      const data = parseMotionCSV(text)
      if (data.length > 0) {
        setMotionData(data)
      }
      e.target.value = ''
    },
    [setMotionData]
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Motion Analyzer
      </h3>

      <SensitivityPanel />
      <div className="border-t border-[var(--color-border)]" />
      <ROISelector />
      <div className="border-t border-[var(--color-border)]" />

      {/* Data info */}
      {motionData.length > 0 && (
        <div className="text-xs text-[var(--color-text-muted)]">
          {motionData.length} frames analyzed
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleExportCSV}
          disabled={motionData.length === 0}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-lg
            bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-30
            disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>

        <button
          onClick={() => importRef.current?.click()}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-lg
            bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Import CSV
        </button>

        {motionData.length > 0 && (
          <button
            onClick={clearMotionData}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-lg
              text-[var(--color-error)] bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Data
          </button>
        )}
      </div>

      <input
        ref={importRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImportCSV}
      />
    </div>
  )
}
