import { useRef, useEffect, useCallback } from 'react'
import { useMotionStore } from '../stores/motionStore'
import { useVideoStore } from '../stores/videoStore'

export function useMotionProcessor(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const threshold = useMotionStore((s) => s.threshold)
  const roi = useMotionStore((s) => s.roi)
  const addMotionDataPoint = useMotionStore((s) => s.addMotionDataPoint)
  const setCurrentMotionMask = useMotionStore((s) => s.setCurrentMotionMask)
  const video = useVideoStore((s) => s.video)
  const currentFrame = useVideoStore((s) => s.currentFrame)

  const prevFrameData = useRef<Uint8ClampedArray | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const lastProcessedFrame = useRef<number>(-1)

  // Initialize worker
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/motion.worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (e) => {
      const { changedPixels, motionMask, width, height } = e.data
      const imageData = new ImageData(new Uint8ClampedArray(motionMask), width, height)
      setCurrentMotionMask(imageData)

      const frame = lastProcessedFrame.current
      if (frame >= 0) {
        addMotionDataPoint({ frame, changedPixels })
      }
    }

    workerRef.current = worker
    return () => worker.terminate()
  }, [addMotionDataPoint, setCurrentMotionMask])

  // Process current frame
  const processFrame = useCallback(() => {
    const videoEl = videoRef.current
    const canvas = canvasRef.current
    const worker = workerRef.current
    if (!videoEl || !canvas || !worker || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = video
    const currentData = ctx.getImageData(0, 0, width, height)

    if (prevFrameData.current && currentFrame !== lastProcessedFrame.current) {
      lastProcessedFrame.current = currentFrame
      worker.postMessage({
        type: 'process',
        currentFrame: currentData.data,
        previousFrame: prevFrameData.current,
        width,
        height,
        threshold,
        roi,
      })
    }

    prevFrameData.current = new Uint8ClampedArray(currentData.data)
  }, [video, currentFrame, threshold, roi, videoRef, canvasRef])

  // Auto-process on frame changes
  useEffect(() => {
    if (!video) return
    // Small delay to ensure canvas is drawn
    const timer = setTimeout(processFrame, 16)
    return () => clearTimeout(timer)
  }, [currentFrame, processFrame, video])

  return { processFrame }
}
