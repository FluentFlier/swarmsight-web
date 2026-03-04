import { useEffect } from 'react'
import { useVideoStore } from '../stores/videoStore'
import { PLAYBACK_SPEEDS } from '../types/video'
import type { PlaybackSpeed } from '../types/video'

export function useKeyboardShortcuts() {
  const togglePlaying = useVideoStore((s) => s.togglePlaying)
  const stepFrame = useVideoStore((s) => s.stepFrame)
  const setPlaybackSpeed = useVideoStore((s) => s.setPlaybackSpeed)
  const isLoaded = useVideoStore((s) => s.isLoaded)

  useEffect(() => {
    if (!isLoaded) return

    const handler = (e: KeyboardEvent) => {
      // Don't capture shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlaying()
          break
        case ',':
          e.preventDefault()
          stepFrame(-1)
          break
        case '.':
          e.preventDefault()
          stepFrame(1)
          break
        case 'ArrowLeft':
          e.preventDefault()
          stepFrame(e.shiftKey ? -10 : -5)
          break
        case 'ArrowRight':
          e.preventDefault()
          stepFrame(e.shiftKey ? 10 : 5)
          break
        case '[': {
          e.preventDefault()
          const speed = useVideoStore.getState().playbackSpeed
          const idx = PLAYBACK_SPEEDS.indexOf(speed)
          if (idx > 0) setPlaybackSpeed(PLAYBACK_SPEEDS[idx - 1] as PlaybackSpeed)
          break
        }
        case ']': {
          e.preventDefault()
          const speed = useVideoStore.getState().playbackSpeed
          const idx = PLAYBACK_SPEEDS.indexOf(speed)
          if (idx < PLAYBACK_SPEEDS.length - 1) setPlaybackSpeed(PLAYBACK_SPEEDS[idx + 1] as PlaybackSpeed)
          break
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isLoaded, togglePlaying, stepFrame, setPlaybackSpeed])
}
