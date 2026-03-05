import { useState, useRef, useCallback, lazy, Suspense } from 'react'
import { AppShell } from './components/layout/AppShell'
import { MotionControls } from './components/motion/MotionControls'
import { ActivityChart } from './components/results/ActivityChart'
import { AppendageControls } from './components/appendage/AppendageControls'
import { AnnotationEditor } from './components/results/AnnotationEditor'
import { ExportButton } from './components/shared/ExportButton'
import { ColabExportModal } from './components/shared/ColabExportModal'
import { OnboardingTooltip } from './components/shared/OnboardingTooltip'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useMotionProcessor } from './hooks/useMotionProcessor'
import { useVideoStore } from './stores/videoStore'
import { useMotionStore } from './stores/motionStore'
import { Cloud } from 'lucide-react'
import type { ModuleType } from './types/config'
import type { VideoPlayerHandle } from './components/video/VideoPlayer'
import type { Correction } from './components/results/AnnotationEditor'

const ComparisonView = lazy(() =>
  import('./components/results/ComparisonView').then((m) => ({ default: m.ComparisonView }))
)

function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('motion_analyzer')
  const [showColabModal, setShowColabModal] = useState(false)
  const playerRef = useRef<VideoPlayerHandle>(null)
  const isLoaded = useVideoStore((s) => s.isLoaded)
  const currentFrame = useVideoStore((s) => s.currentFrame)
  const motionData = useMotionStore((s) => s.motionData)

  const [corrections, setCorrections] = useState<
    Record<string, Record<string, { x: number; y: number }>>
  >({})

  useKeyboardShortcuts()
  useMotionProcessor(
    playerRef.current?.videoRef ?? { current: null },
    playerRef.current?.canvasRef ?? { current: null }
  )

  const addCorrection = useCallback((correction: Correction) => {
    setCorrections((prev) => {
      const frameKey = correction.frame.toString()
      const existing = prev[frameKey] || {}
      return {
        ...prev,
        [frameKey]: {
          ...existing,
          [correction.tipType]: { x: correction.x, y: correction.y },
        },
      }
    })
  }, [])

  const removeCorrection = useCallback((frame: number, tipType: string) => {
    setCorrections((prev) => {
      const frameKey = frame.toString()
      const existing = { ...prev[frameKey] }
      delete existing[tipType]
      if (Object.keys(existing).length === 0) {
        const next = { ...prev }
        delete next[frameKey]
        return next
      }
      return { ...prev, [frameKey]: existing }
    })
  }, [])

  const sidebar = activeModule === 'motion_analyzer' ? (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <MotionControls />
        {motionData.length > 0 && (
          <Suspense fallback={<div className="p-4 text-xs text-[var(--color-text-muted)]">Loading...</div>}>
            <div className="border-t border-[var(--color-border)]" />
            <ComparisonView />
          </Suspense>
        )}
      </div>
      <div className="border-t border-[var(--color-border)]">
        <button
          onClick={() => setShowColabModal(true)}
          className="flex items-center gap-2 w-full px-4 py-2 text-xs text-[var(--color-text-muted)]
            hover:text-[var(--color-text)] hover:bg-[var(--color-surface-overlay)] transition-colors"
        >
          <Cloud className="w-3.5 h-3.5" />
          Export to Colab for batch processing
        </button>
      </div>
      <ExportButton activeModule={activeModule} corrections={{ vid_001: corrections }} />
    </div>
  ) : (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <AppendageControls sourceCanvas={playerRef.current?.canvasRef?.current ?? null} />
        <div className="border-t border-[var(--color-border)] mx-4" />
        <div className="p-4">
          <AnnotationEditor
            currentFrame={currentFrame}
            corrections={{ vid_001: corrections }}
            onAddCorrection={addCorrection}
            onRemoveCorrection={removeCorrection}
          />
        </div>
      </div>
      <div className="border-t border-[var(--color-border)]">
        <button
          onClick={() => setShowColabModal(true)}
          className="flex items-center gap-2 w-full px-4 py-2 text-xs text-[var(--color-text-muted)]
            hover:text-[var(--color-text)] hover:bg-[var(--color-surface-overlay)] transition-colors"
        >
          <Cloud className="w-3.5 h-3.5" />
          Export to Colab for batch processing
        </button>
      </div>
      <ExportButton activeModule={activeModule} corrections={{ vid_001: corrections }} />
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <AppShell
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        sidebar={sidebar}
        playerRef={playerRef}
        showSensorWidget={activeModule === 'appendage_tracker' && isLoaded}
      />
      {isLoaded && activeModule === 'motion_analyzer' && motionData.length > 0 && (
        <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2">
          <ActivityChart height={120} />
        </div>
      )}

      <ColabExportModal isOpen={showColabModal} onClose={() => setShowColabModal(false)} />
      <OnboardingTooltip />
    </div>
  )
}

export default App
