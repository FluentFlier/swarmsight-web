import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useMotionStore } from '../../stores/motionStore'
import { useVideoStore } from '../../stores/videoStore'
import type { MotionDataPoint } from '../../stores/motionStore'

interface ActivityChartProps {
  data?: MotionDataPoint[]
  comparisonData?: MotionDataPoint[]
  comparisonLabel?: string
  onFrameClick?: (frame: number) => void
  height?: number
}

export function ActivityChart({
  data: externalData,
  comparisonData,
  comparisonLabel = 'Comparison',
  onFrameClick,
  height = 200,
}: ActivityChartProps) {
  const motionData = useMotionStore((s) => s.motionData)
  const currentFrame = useVideoStore((s) => s.currentFrame)
  const setCurrentFrame = useVideoStore((s) => s.setCurrentFrame)
  const video = useVideoStore((s) => s.video)

  const chartData = externalData || motionData

  const mergedData = useMemo(() => {
    if (!comparisonData) return chartData

    const map = new Map<number, { frame: number; changedPixels: number; comparison?: number }>()
    for (const d of chartData) {
      map.set(d.frame, { ...d })
    }
    for (const d of comparisonData) {
      const existing = map.get(d.frame)
      if (existing) {
        existing.comparison = d.changedPixels
      } else {
        map.set(d.frame, { frame: d.frame, changedPixels: 0, comparison: d.changedPixels })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.frame - b.frame)
  }, [chartData, comparisonData])

  if (mergedData.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-[var(--color-text-muted)]" style={{ height }}>
        No motion data yet. Play the video to analyze.
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = (data: any) => {
    const frame = data?.activePayload?.[0]?.payload?.frame
    if (frame !== undefined) {
      if (onFrameClick) {
        onFrameClick(frame)
      } else {
        setCurrentFrame(frame)
      }
    }
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={mergedData} onClick={handleClick} style={{ cursor: 'pointer' }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="frame"
          tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
          tickFormatter={(v) => {
            if (video) {
              const sec = v / video.fps
              return `${sec.toFixed(1)}s`
            }
            return v
          }}
        />
        <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
        <Tooltip
          contentStyle={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '11px',
          }}
          labelFormatter={(v) => `Frame ${v}`}
        />
        <Line
          type="monotone"
          dataKey="changedPixels"
          stroke="var(--color-accent)"
          dot={false}
          strokeWidth={1.5}
          name="Changed Pixels"
        />
        {comparisonData && (
          <Line
            type="monotone"
            dataKey="comparison"
            stroke="var(--color-warning)"
            dot={false}
            strokeWidth={1.5}
            name={comparisonLabel}
          />
        )}
        {video && (
          <ReferenceLine
            x={currentFrame}
            stroke="var(--color-error)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
