import { type ReactNode, type RefObject } from 'react'
import { useVideoStore } from '../../stores/videoStore'
import { FileDropzone } from '../shared/FileDropzone'
import { VideoPlayer, type VideoPlayerHandle } from '../video/VideoPlayer'
import { VideoControls } from '../video/VideoControls'
import { SensorWidget } from '../appendage/SensorWidget'
import { KeyboardHelp } from '../shared/KeyboardHelp'
import type { ModuleType } from '../../types/config'
import { Bug, Activity, X, Github } from 'lucide-react'

interface AppShellProps {
  activeModule: ModuleType
  onModuleChange: (module: ModuleType) => void
  sidebar?: ReactNode
  playerRef?: RefObject<VideoPlayerHandle | null>
  showSensorWidget?: boolean
}

const MODULES: { id: ModuleType; label: string; icon: typeof Bug }[] = [
  { id: 'appendage_tracker', label: 'Appendage Tracker', icon: Bug },
  { id: 'motion_analyzer', label: 'Motion Analyzer', icon: Activity },
]

export function AppShell({ activeModule, onModuleChange, sidebar, playerRef, showSensorWidget }: AppShellProps) {
  const isLoaded = useVideoStore((s) => s.isLoaded)
  const video = useVideoStore((s) => s.video)
  const unloadVideo = useVideoStore((s) => s.unloadVideo)

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <header className="flex items-center justify-between h-12 px-4 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-sm font-semibold tracking-wide">SwarmSight</h1>

          <nav className="flex items-center gap-1">
            {MODULES.map((mod) => {
              const Icon = mod.icon
              const isActive = activeModule === mod.id
              return (
                <button
                  key={mod.id}
                  onClick={() => onModuleChange(mod.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                    ${isActive
                      ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-overlay)]'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {mod.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {video && (
            <>
              <span className="text-xs text-[var(--color-text-muted)] truncate max-w-48">
                {video.fileName}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                ({(video.fileSize / (1024 * 1024)).toFixed(1)} MB)
              </span>
              <button
                onClick={unloadVideo}
                className="p-1 rounded hover:bg-[var(--color-surface-overlay)] transition-colors"
                title="Close video"
              >
                <X className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              </button>
              <div className="w-px h-4 bg-[var(--color-border)]" />
            </>
          )}
          <KeyboardHelp />
          <a
            href="https://github.com/FluentFlier/swarmsight-web"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-[var(--color-surface-overlay)] transition-colors"
            title="GitHub"
          >
            <Github className="w-4 h-4 text-[var(--color-text-muted)]" />
          </a>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 min-h-0 relative">
            {isLoaded ? (
              <>
                <VideoPlayer ref={playerRef} />
                {showSensorWidget && <SensorWidget />}
              </>
            ) : (
              <FileDropzone />
            )}
          </div>
          {isLoaded && <VideoControls />}
        </div>

        {sidebar && (
          <aside className="w-80 border-l border-[var(--color-border)] bg-[var(--color-surface-raised)] shrink-0">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  )
}
