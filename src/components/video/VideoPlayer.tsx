import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useVideoStore } from '../../stores/videoStore'
import { useMotionStore } from '../../stores/motionStore'

export interface VideoPlayerHandle {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export const VideoPlayer = forwardRef<VideoPlayerHandle>(function VideoPlayer(_, ref) {
  const video = useVideoStore((s) => s.video)
  const isPlaying = useVideoStore((s) => s.isPlaying)
  const currentFrame = useVideoStore((s) => s.currentFrame)
  const playbackSpeed = useVideoStore((s) => s.playbackSpeed)
  const setCurrentFrame = useVideoStore((s) => s.setCurrentFrame)
  const setPlaying = useVideoStore((s) => s.setPlaying)
  const showMotion = useMotionStore((s) => s.showMotion)
  const currentMotionMask = useMotionStore((s) => s.currentMotionMask)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)
  const lastDrawnFrame = useRef<number>(-1)

  useImperativeHandle(ref, () => ({ videoRef, canvasRef }))

  const drawFrame = useCallback(() => {
    const videoEl = videoRef.current
    const canvas = canvasRef.current
    if (!videoEl || !canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.width
    canvas.height = video.height
    ctx.drawImage(videoEl, 0, 0, video.width, video.height)
  }, [video])

  // Draw motion overlay
  useEffect(() => {
    const overlay = overlayCanvasRef.current
    if (!overlay || !video) return
    const ctx = overlay.getContext('2d')
    if (!ctx) return

    overlay.width = video.width
    overlay.height = video.height

    if (showMotion && currentMotionMask) {
      ctx.putImageData(currentMotionMask, 0, 0)
    } else {
      ctx.clearRect(0, 0, video.width, video.height)
    }
  }, [showMotion, currentMotionMask, video])

  const seekToFrame = useCallback(
    (frame: number) => {
      const videoEl = videoRef.current
      if (!videoEl || !video) return
      videoEl.currentTime = frame / video.fps
    },
    [video]
  )

  // Playback loop
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl || !video) return

    if (isPlaying) {
      videoEl.playbackRate = playbackSpeed
      videoEl.play().catch(() => setPlaying(false))

      const onFrame = () => {
        drawFrame()
        const newFrame = Math.round(videoEl.currentTime * video.fps)
        if (newFrame !== lastDrawnFrame.current) {
          lastDrawnFrame.current = newFrame
          setCurrentFrame(newFrame)
        }
        animFrameRef.current = requestAnimationFrame(onFrame)
      }
      animFrameRef.current = requestAnimationFrame(onFrame)

      return () => cancelAnimationFrame(animFrameRef.current)
    } else {
      videoEl.pause()
    }
  }, [isPlaying, playbackSpeed, video, drawFrame, setCurrentFrame, setPlaying])

  // Seek when paused
  useEffect(() => {
    if (isPlaying) return
    if (currentFrame === lastDrawnFrame.current) return

    const videoEl = videoRef.current
    if (!videoEl || !video) return

    lastDrawnFrame.current = currentFrame
    videoEl.currentTime = currentFrame / video.fps

    const onSeeked = () => {
      drawFrame()
      videoEl.removeEventListener('seeked', onSeeked)
    }
    videoEl.addEventListener('seeked', onSeeked)
    return () => videoEl.removeEventListener('seeked', onSeeked)
  }, [currentFrame, isPlaying, video, drawFrame])

  // Video end
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return
    const onEnded = () => setPlaying(false)
    videoEl.addEventListener('ended', onEnded)
    return () => videoEl.removeEventListener('ended', onEnded)
  }, [setPlaying])

  // Initial load
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl || !video) return

    videoEl.src = video.objectUrl
    videoEl.load()

    const onLoaded = () => {
      seekToFrame(0)
      const onSeeked = () => {
        drawFrame()
        videoEl.removeEventListener('seeked', onSeeked)
      }
      videoEl.addEventListener('seeked', onSeeked)
    }
    videoEl.addEventListener('loadeddata', onLoaded, { once: true })
    return () => videoEl.removeEventListener('loadeddata', onLoaded)
  }, [video, drawFrame, seekToFrame])

  if (!video) return null

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full h-full bg-black">
      <video ref={videoRef} className="hidden" muted playsInline preload="auto" />
      <div className="relative max-w-full max-h-full" style={{ aspectRatio: `${video.width} / ${video.height}` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'screen' }}
        />
      </div>
    </div>
  )
})
