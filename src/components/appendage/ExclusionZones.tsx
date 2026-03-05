import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAppendageStore } from '../../stores/appendageStore'

export function ExclusionZones() {
  const zones = useAppendageStore((s) => s.exclusionZones)
  const addZone = useAppendageStore((s) => s.addExclusionZone)
  const removeZone = useAppendageStore((s) => s.removeExclusionZone)
  const standardSpace = useAppendageStore((s) => s.standardSpace)
  const [adding, setAdding] = useState(false)
  const [newZone, setNewZone] = useState({ x: 0, y: 0, width: 50, height: 30 })

  const handleAdd = () => {
    addZone(newZone)
    setAdding(false)
    setNewZone({ x: 0, y: 0, width: 50, height: 30 })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium">Exclusion Zones</label>
        <button
          onClick={() => setAdding(!adding)}
          className="p-1 rounded hover:bg-[var(--color-surface-overlay)] transition-colors"
          title="Add exclusion zone"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)]">
        Mask regions in standard space ({standardSpace.width}x{standardSpace.height}) to exclude from tracking.
      </p>

      {adding && (
        <div className="flex flex-col gap-1.5 p-2 rounded bg-[var(--color-surface-overlay)]">
          <div className="grid grid-cols-2 gap-1.5">
            {(['x', 'y', 'width', 'height'] as const).map((key) => (
              <div key={key}>
                <label className="text-[9px] text-[var(--color-text-muted)] uppercase">{key}</label>
                <input
                  type="number"
                  value={newZone[key]}
                  onChange={(e) => setNewZone({ ...newZone, [key]: parseInt(e.target.value) || 0 })}
                  className="w-full mt-0.5 px-1.5 py-0.5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)]
                    rounded focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleAdd}
            className="w-full px-2 py-1 text-xs font-medium rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Add Zone
          </button>
        </div>
      )}

      {zones.length === 0 && !adding && (
        <p className="text-[10px] text-[var(--color-text-muted)] italic">No exclusion zones defined.</p>
      )}

      {zones.map((zone, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-2 py-1 text-xs rounded bg-[var(--color-surface-overlay)]"
        >
          <span className="font-mono text-[10px]">
            ({zone.x}, {zone.y}) {zone.width}x{zone.height}
          </span>
          <button
            onClick={() => removeZone(i)}
            className="p-0.5 rounded hover:bg-[var(--color-border)] transition-colors"
          >
            <Trash2 className="w-3 h-3 text-[var(--color-error)]" />
          </button>
        </div>
      ))}
    </div>
  )
}
