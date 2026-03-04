import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useVideoStore } from '../../stores/videoStore'
import { PLAYBACK_SPEEDS } from '../../types/video'
import type { PlaybackSpeed } from '../../types/video'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

export function VideoControls() {
  const video = useVideoStore((s) => s.video)
  const isPlaying = useVideoStore((s) => s.isPlaying)
  const currentFrame = useVideoStore((s) => s.currentFrame)
  const playbackSpeed = useVideoStore((s) => s.playbackSpeed)
  const togglePlaying = useVideoStore((s) => s.togglePlaying)
  const stepFrame = useVideoStore((s) => s.stepFrame)
  const setCurrentFrame = useVideoStore((s) => s.setCurrentFrame)
  const setPlaybackSpeed = useVideoStore((s) => s.setPlaybackSpeed)

  if (!video) return null

  const currentTime = currentFrame / video.fps
  const progress = video.totalFrames > 0 ? (currentFrame / (video.totalFrames - 1)) * 100 : 0

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = Math.round((parseFloat(e.target.value) / 100) * (video.totalFrames - 1))
    setCurrentFrame(frame)
  }

  const cycleSpeed = () => {
    const idx = PLAYBACK_SPEEDS.indexOf(playbackSpeed)
    const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length]
    setPlaybackSpeed(next as PlaybackSpeed)
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-[var(--color-surface-raised)] border-t border-[var(--color-border)]">
      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={100}
        step={0.01}
        value={progress}
        onChange={handleSeek}
        className="w-full h-1 appearance-none bg-[var(--color-border)] rounded-full cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:bg-[var(--color-accent)] [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:cursor-pointer"
      />

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Left: transport controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentFrame(0)}
            className="p-1.5 rounded hover:bg-[var(--color-surface-overlay)] transition-colors"
            title="Go to start"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => stepFrame(-1)}
            className="p-1.5 rounded hover:bg-[var(--color-surface-overlay)] transition-colors"
            title="Previous frame (,)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlaying}
            className="p-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors"
            title="Play/Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => stepFrame(1)}
            className="p-1.5 rounded hover:bg-[var(--color-surface-overlay)] transition-colors"
            title="Next frame (.)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentFrame(video.totalFrames - 1)}
            className="p-1.5 rounded hover:bg-[var(--color-surface-overlay)] transition-colors"
            title="Go to end"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Center: frame info */}
        <div className="flex items-center gap-3 text-xs font-mono text-[var(--color-text-muted)]">
          <span>{formatTime(currentTime)} / {formatTime(video.duration)}</span>
          <span className="text-[var(--color-border)]">|</span>
          <span>Frame {currentFrame} / {video.totalFrames - 1}</span>
        </div>

        {/* Right: speed + info */}
        <div className="flex items-center gap-2">
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 text-xs font-mono rounded bg-[var(--color-surface-overlay)]
              hover:bg-[var(--color-border)] transition-colors"
            title="Playback speed (click to cycle)"
          >
            {playbackSpeed}x
          </button>
          <span className="text-xs text-[var(--color-text-muted)]">
            {video.width}×{video.height} · {video.fps}fps
          </span>
        </div>
      </div>
    </div>
  )
}
