import type { TipPosition } from '../../lib/tipDetector'
import type { ConvexHullPriors } from '../../lib/convexHullPriors'
import { useVideoStore } from '../../stores/videoStore'
import { useAppendageStore } from '../../stores/appendageStore'

interface TipOverlayProps {
  leftTip: TipPosition | null
  rightTip: TipPosition | null
  proboscisTip: TipPosition | null
  priors: ConvexHullPriors | null
  corrections: Record<string, { x: number; y: number }> | null
}

export function TipOverlay({ leftTip, rightTip, proboscisTip, priors, corrections }: TipOverlayProps) {
  const video = useVideoStore((s) => s.video)
  const sensor = useAppendageStore((s) => s.sensor)

  if (!video) return null

  // Transform tip from standard space to video space
  const toVideo = (sx: number, sy: number) => {
    const standardW = 200
    const standardH = 200
    const dx = sx - standardW / 2
    const dy = sy - standardH / 2
    const scaledX = dx * sensor.scaleX
    const scaledY = dy * sensor.scaleY
    const angle = (sensor.rotationDeg * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x: scaledX * cos - scaledY * sin + sensor.centerX,
      y: scaledX * sin + scaledY * cos + sensor.centerY,
    }
  }

  const tips: { tip: TipPosition; label: string; color: string; corrected: boolean }[] = []

  if (leftTip) {
    const isCorrected = corrections?.['left_tip'] != null
    tips.push({
      tip: isCorrected ? { ...leftTip, x: corrections!['left_tip'].x, y: corrections!['left_tip'].y } : leftTip,
      label: 'L',
      color: isCorrected ? '#f97316' : '#22c55e',
      corrected: isCorrected,
    })
  }
  if (rightTip) {
    const isCorrected = corrections?.['right_tip'] != null
    tips.push({
      tip: isCorrected ? { ...rightTip, x: corrections!['right_tip'].x, y: corrections!['right_tip'].y } : rightTip,
      label: 'R',
      color: isCorrected ? '#f97316' : '#22c55e',
      corrected: isCorrected,
    })
  }
  if (proboscisTip) {
    const isCorrected = corrections?.['proboscis_tip'] != null
    tips.push({
      tip: isCorrected ? { ...proboscisTip, x: corrections!['proboscis_tip'].x, y: corrections!['proboscis_tip'].y } : proboscisTip,
      label: 'P',
      color: isCorrected ? '#f97316' : '#3b82f6',
      corrected: isCorrected,
    })
  }

  return (
    <svg
      viewBox={`0 0 ${video.width} ${video.height}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 15 }}
    >
      {tips.map(({ tip, label, color }) => {
        const pos = toVideo(tip.x, tip.y)
        return (
          <g key={label}>
            <circle cx={pos.x} cy={pos.y} r={5} fill={color} fillOpacity={0.8} stroke="white" strokeWidth={1.5} />
            <text
              x={pos.x + 8}
              y={pos.y + 4}
              fill={color}
              fontSize={12}
              fontWeight="bold"
              stroke="black"
              strokeWidth={0.5}
              paintOrder="stroke"
            >
              {label}
            </text>
          </g>
        )
      })}

      {/* Draw lines from base to tip */}
      {priors && leftTip && (
        <line
          x1={toVideo(priors.leftBase.x, priors.leftBase.y).x}
          y1={toVideo(priors.leftBase.x, priors.leftBase.y).y}
          x2={toVideo(leftTip.x, leftTip.y).x}
          y2={toVideo(leftTip.x, leftTip.y).y}
          stroke="#22c55e"
          strokeWidth={1}
          strokeOpacity={0.5}
          strokeDasharray="3 2"
        />
      )}
      {priors && rightTip && (
        <line
          x1={toVideo(priors.rightBase.x, priors.rightBase.y).x}
          y1={toVideo(priors.rightBase.x, priors.rightBase.y).y}
          x2={toVideo(rightTip.x, rightTip.y).x}
          y2={toVideo(rightTip.x, rightTip.y).y}
          stroke="#22c55e"
          strokeWidth={1}
          strokeOpacity={0.5}
          strokeDasharray="3 2"
        />
      )}
    </svg>
  )
}
