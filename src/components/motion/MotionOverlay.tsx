import { useRef, useEffect } from 'react'
import { useMotionStore } from '../../stores/motionStore'

interface MotionOverlayProps {
  videoWidth: number
  videoHeight: number
}

export function MotionOverlay({ videoWidth, videoHeight }: MotionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const showMotion = useMotionStore((s) => s.showMotion)
  const currentMotionMask = useMotionStore((s) => s.currentMotionMask)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = videoWidth
    canvas.height = videoHeight

    if (showMotion && currentMotionMask) {
      ctx.putImageData(currentMotionMask, 0, 0)
    } else {
      ctx.clearRect(0, 0, videoWidth, videoHeight)
    }
  }, [showMotion, currentMotionMask, videoWidth, videoHeight])

  if (!showMotion || !currentMotionMask) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
