import { useRef, useEffect, useCallback } from 'react'
import { useVideoStore } from '../../stores/videoStore'

export function VideoPlayer() {
  const video = useVideoStore((s) => s.video)
  const isPlaying = useVideoStore((s) => s.isPlaying)
  const currentFrame = useVideoStore((s) => s.currentFrame)
  const playbackSpeed = useVideoStore((s) => s.playbackSpeed)
  const setCurrentFrame = useVideoStore((s) => s.setCurrentFrame)
  const setPlaying = useVideoStore((s) => s.setPlaying)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)
  const lastDrawnFrame = useRef<number>(-1)

  // Draw current video frame to canvas
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

  // Seek to a specific frame
  const seekToFrame = useCallback(
    (frame: number) => {
      const videoEl = videoRef.current
      if (!videoEl || !video) return

      const time = frame / video.fps
      videoEl.currentTime = time
    },
    [video]
  )

  // Handle playback loop
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

  // Handle frame seeking (when paused and frame changes externally)
  useEffect(() => {
    if (isPlaying) return
    if (currentFrame === lastDrawnFrame.current) return

    const videoEl = videoRef.current
    if (!videoEl || !video) return

    lastDrawnFrame.current = currentFrame
    const time = currentFrame / video.fps
    videoEl.currentTime = time

    const onSeeked = () => {
      drawFrame()
      videoEl.removeEventListener('seeked', onSeeked)
    }
    videoEl.addEventListener('seeked', onSeeked)

    return () => videoEl.removeEventListener('seeked', onSeeked)
  }, [currentFrame, isPlaying, video, drawFrame])

  // Handle video end
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const onEnded = () => setPlaying(false)
    videoEl.addEventListener('ended', onEnded)
    return () => videoEl.removeEventListener('ended', onEnded)
  }, [setPlaying])

  // Initial frame draw on load
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
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain"
        style={{
          aspectRatio: `${video.width} / ${video.height}`,
        }}
      />
    </div>
  )
}
