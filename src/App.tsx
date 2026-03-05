import { useState, useRef } from 'react'
import { AppShell } from './components/layout/AppShell'
import { MotionControls } from './components/motion/MotionControls'
import { ActivityChart } from './components/results/ActivityChart'
import { ComparisonView } from './components/results/ComparisonView'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useMotionProcessor } from './hooks/useMotionProcessor'
import { useVideoStore } from './stores/videoStore'
import { useMotionStore } from './stores/motionStore'
import type { ModuleType } from './types/config'
import type { VideoPlayerHandle } from './components/video/VideoPlayer'

function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('motion_analyzer')
  const playerRef = useRef<VideoPlayerHandle>(null)
  const isLoaded = useVideoStore((s) => s.isLoaded)
  const motionData = useMotionStore((s) => s.motionData)

  useKeyboardShortcuts()
  useMotionProcessor(
    playerRef.current?.videoRef ?? { current: null },
    playerRef.current?.canvasRef ?? { current: null }
  )

  const sidebar = activeModule === 'motion_analyzer' ? (
    <div className="flex flex-col h-full">
      <MotionControls />
      {motionData.length > 0 && (
        <>
          <div className="border-t border-[var(--color-border)]" />
          <ComparisonView />
        </>
      )}
    </div>
  ) : (
    <div className="p-4">
      <p className="text-xs text-[var(--color-text-muted)]">
        Appendage tracker controls coming soon.
      </p>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <AppShell
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        sidebar={sidebar}
        playerRef={playerRef}
      />
      {/* Bottom activity chart */}
      {isLoaded && activeModule === 'motion_analyzer' && motionData.length > 0 && (
        <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2">
          <ActivityChart height={120} />
        </div>
      )}
    </div>
  )
}

export default App
