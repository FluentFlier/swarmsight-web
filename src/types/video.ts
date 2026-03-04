export interface VideoMetadata {
  fileName: string
  fileSize: number
  width: number
  height: number
  duration: number
  fps: number
  totalFrames: number
  objectUrl: string
}

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2

export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 1, 2]
