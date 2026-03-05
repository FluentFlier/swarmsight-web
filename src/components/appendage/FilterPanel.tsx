import { useAppendageStore } from '../../stores/appendageStore'

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
        <span>{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1 appearance-none bg-[var(--color-border)] rounded-full cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
          [&::-webkit-slider-thumb]:bg-[var(--color-accent)] [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  )
}

export function FilterPanel() {
  const filters = useAppendageStore((s) => s.filters)
  const setFilters = useAppendageStore((s) => s.setFilters)

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-medium">Color Filter (HSL)</label>

      <div className="flex flex-col gap-2">
        <Slider label="Hue Min" value={filters.hueMin} min={0} max={360} onChange={(v) => setFilters({ hueMin: v })} />
        <Slider label="Hue Max" value={filters.hueMax} min={0} max={360} onChange={(v) => setFilters({ hueMax: v })} />
      </div>

      <div className="flex flex-col gap-2">
        <Slider label="Saturation Min" value={filters.saturationMin} min={0} max={100} onChange={(v) => setFilters({ saturationMin: v })} />
        <Slider label="Saturation Max" value={filters.saturationMax} min={0} max={100} onChange={(v) => setFilters({ saturationMax: v })} />
      </div>

      <div className="flex flex-col gap-2">
        <Slider label="Lightness Min" value={filters.lightnessMin} min={0} max={100} onChange={(v) => setFilters({ lightnessMin: v })} />
        <Slider label="Lightness Max" value={filters.lightnessMax} min={0} max={100} onChange={(v) => setFilters({ lightnessMax: v })} />
      </div>

      {/* Filter preview will render below when active */}
    </div>
  )
}
