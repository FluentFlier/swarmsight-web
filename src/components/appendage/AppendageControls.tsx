import { FilterPanel } from './FilterPanel'
import { ExclusionZones } from './ExclusionZones'
import { TreatmentSensorPanel } from './TreatmentSensor'
import { SensorPreview } from './SensorPreview'
import { useAppendageStore } from '../../stores/appendageStore'

interface AppendageControlsProps {
  sourceCanvas: HTMLCanvasElement | null
}

export function AppendageControls({ sourceCanvas }: AppendageControlsProps) {
  const sensor = useAppendageStore((s) => s.sensor)

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Appendage Tracker
      </h3>

      {/* Sensor position info */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Sensor Widget</label>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Drag the blue rectangle on the video to position the sensor.
          Use corner handles to scale, top handle to rotate.
        </p>
        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-[var(--color-text-muted)]">
          <span>x: {Math.round(sensor.centerX)}</span>
          <span>y: {Math.round(sensor.centerY)}</span>
          <span>rot: {sensor.rotationDeg.toFixed(1)}</span>
          <span>sx: {sensor.scaleX.toFixed(2)}</span>
          <span>sy: {sensor.scaleY.toFixed(2)}</span>
          <span>{sensor.width}x{sensor.height}</span>
        </div>
        <p className="text-[9px] text-[var(--color-text-muted)]">
          Alt+Arrows: nudge | R/Shift+R: rotate
        </p>
      </div>

      <div className="border-t border-[var(--color-border)]" />

      <SensorPreview sourceCanvas={sourceCanvas} />

      <div className="border-t border-[var(--color-border)]" />

      <FilterPanel />

      <div className="border-t border-[var(--color-border)]" />

      <ExclusionZones />

      <div className="border-t border-[var(--color-border)]" />

      <TreatmentSensorPanel />
    </div>
  )
}
