import { create } from 'zustand'
import type { VideoMetadata, PlaybackSpeed } from '../types/video'

interface VideoState {
  // Video metadata
  video: VideoMetadata | null
  isLoaded: boolean

  // Playback state
  isPlaying: boolean
  currentFrame: number
  playbackSpeed: PlaybackSpeed

  // Actions
  loadVideo: (metadata: VideoMetadata) => void
  unloadVideo: () => void
  setPlaying: (playing: boolean) => void
  togglePlaying: () => void
  setCurrentFrame: (frame: number) => void
  stepFrame: (delta: number) => void
  setPlaybackSpeed: (speed: PlaybackSpeed) => void
  seekToTime: (time: number) => void
}

export const useVideoStore = create<VideoState>((set, get) => ({
  video: null,
  isLoaded: false,
  isPlaying: false,
  currentFrame: 0,
  playbackSpeed: 1,

  loadVideo: (metadata) =>
    set({
      video: metadata,
      isLoaded: true,
      isPlaying: false,
      currentFrame: 0,
      playbackSpeed: 1,
    }),

  unloadVideo: () => {
    const { video } = get()
    if (video) {
      URL.revokeObjectURL(video.objectUrl)
    }
    set({
      video: null,
      isLoaded: false,
      isPlaying: false,
      currentFrame: 0,
    })
  },

  setPlaying: (playing) => set({ isPlaying: playing }),

  togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setCurrentFrame: (frame) => {
    const { video } = get()
    if (!video) return
    const clamped = Math.max(0, Math.min(frame, video.totalFrames - 1))
    set({ currentFrame: clamped })
  },

  stepFrame: (delta) => {
    const { currentFrame, video } = get()
    if (!video) return
    const next = Math.max(0, Math.min(currentFrame + delta, video.totalFrames - 1))
    set({ currentFrame: next, isPlaying: false })
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  seekToTime: (time) => {
    const { video } = get()
    if (!video) return
    const frame = Math.round(time * video.fps)
    const clamped = Math.max(0, Math.min(frame, video.totalFrames - 1))
    set({ currentFrame: clamped })
  },
}))
