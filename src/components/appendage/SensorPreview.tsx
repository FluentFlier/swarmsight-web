import { useRef, useEffect, useCallback } from 'react'
import { useAppendageStore } from '../../stores/appendageStore'
import { useVideoStore } from '../../stores/videoStore'
import { extractSensorRegion } from '../../lib/spatialTransform'
import { applyHslFilter } from '../../lib/colorspace'

interface SensorPreviewProps {
  sourceCanvas: HTMLCanvasElement | null
}

export function SensorPreview({ sourceCanvas }: SensorPreviewProps) {
  const sensor = useAppendageStore((s) => s.sensor)
  const filters = useAppendageStore((s) => s.filters)
  const standardSpace = useAppendageStore((s) => s.standardSpace)
  const setSensorPreview = useAppendageStore((s) => s.setSensorPreview)
  const setFilteredPreview = useAppendageStore((s) => s.setFilteredPreview)
  const currentFrame = useVideoStore((s) => s.currentFrame)

  const rawCanvasRef = useRef<HTMLCanvasElement>(null)
  const filteredCanvasRef = useRef<HTMLCanvasElement>(null)

  const updatePreviews = useCallback(() => {
    if (!sourceCanvas) return

    // Extract sensor region
    const sensorData = extractSensorRegion(
      sourceCanvas,
      sensor,
      standardSpace.width,
      standardSpace.height
    )
    setSensorPreview(sensorData)

    // Draw raw preview
    const rawCanvas = rawCanvasRef.current
    if (rawCanvas) {
      rawCanvas.width = standardSpace.width
      rawCanvas.height = standardSpace.height
      const ctx = rawCanvas.getContext('2d')
      if (ctx) ctx.putImageData(sensorData, 0, 0)
    }

    // Apply HSL filter
    const filtered = applyHslFilter(
      sensorData,
      filters.hueMin,
      filters.hueMax,
      filters.saturationMin,
      filters.saturationMax,
      filters.lightnessMin,
      filters.lightnessMax
    )
    setFilteredPreview(filtered)

    // Draw filtered preview
    const filteredCanvas = filteredCanvasRef.current
    if (filteredCanvas) {
      filteredCanvas.width = standardSpace.width
      filteredCanvas.height = standardSpace.height
      const ctx = filteredCanvas.getContext('2d')
      if (ctx) ctx.putImageData(filtered, 0, 0)
    }
  }, [sourceCanvas, sensor, filters, standardSpace, setSensorPreview, setFilteredPreview])

  useEffect(() => {
    const timer = setTimeout(updatePreviews, 32)
    return () => clearTimeout(timer)
  }, [currentFrame, updatePreviews])

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium">Sensor Preview</label>

      <div className="flex gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[9px] text-[var(--color-text-muted)] uppercase">Extracted</span>
          <canvas
            ref={rawCanvasRef}
            className="w-full border border-[var(--color-border)] rounded bg-black"
            style={{ aspectRatio: '1 / 1', imageRendering: 'pixelated' }}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[9px] text-[var(--color-text-muted)] uppercase">Filtered</span>
          <canvas
            ref={filteredCanvasRef}
            className="w-full border border-[var(--color-border)] rounded bg-black"
            style={{ aspectRatio: '1 / 1', imageRendering: 'pixelated' }}
          />
        </div>
      </div>
    </div>
  )
}
