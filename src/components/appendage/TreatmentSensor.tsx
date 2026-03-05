import { useAppendageStore } from '../../stores/appendageStore'

export function TreatmentSensorPanel() {
  const ts = useAppendageStore((s) => s.treatmentSensor)
  const setTs = useAppendageStore((s) => s.setTreatmentSensor)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium">Treatment Sensor</label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={ts.enabled}
            onChange={(e) => setTs({ enabled: e.target.checked })}
            className="sr-only"
          />
          <div
            className={`w-8 h-4 rounded-full transition-colors ${
              ts.enabled ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
            }`}
          >
            <div
              className={`w-3 h-3 mt-0.5 rounded-full bg-white transition-transform ${
                ts.enabled ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </div>
        </label>
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)]">
        Detects stimulus application (e.g., odor puff) as pixel intensity sum in a video-space region.
      </p>

      {ts.enabled && (
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'X', key: 'x' as const },
            { label: 'Y', key: 'y' as const },
            { label: 'Width', key: 'width' as const },
            { label: 'Height', key: 'height' as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-[9px] text-[var(--color-text-muted)] uppercase">{label}</label>
              <input
                type="number"
                value={ts[key]}
                onChange={(e) => setTs({ [key]: parseInt(e.target.value) || 0 })}
                className="w-full mt-0.5 px-1.5 py-0.5 text-xs bg-[var(--color-surface-overlay)] border border-[var(--color-border)]
                  rounded focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
