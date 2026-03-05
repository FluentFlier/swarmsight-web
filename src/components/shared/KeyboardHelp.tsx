import { useState } from 'react'
import { Keyboard, X } from 'lucide-react'

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause' },
  { key: ',', desc: 'Previous frame' },
  { key: '.', desc: 'Next frame' },
  { key: '← →', desc: 'Seek ±5 frames' },
  { key: 'Shift + ← →', desc: 'Seek ±10 frames' },
  { key: '[ ]', desc: 'Decrease / Increase speed' },
  { key: 'Alt + Arrows', desc: 'Nudge sensor widget' },
  { key: 'Shift + Alt + Arrows', desc: 'Nudge sensor 10px' },
  { key: 'R', desc: 'Rotate sensor +5°' },
  { key: 'Shift + R', desc: 'Rotate sensor -5°' },
  { key: 'C', desc: 'Enter correction mode' },
]

export function KeyboardHelp() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded hover:bg-[var(--color-surface-overlay)] transition-colors"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="w-4 h-4 text-[var(--color-text-muted)]" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setIsOpen(false)}>
          <div
            className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl shadow-2xl w-96 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-[var(--color-surface-overlay)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              {SHORTCUTS.map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)]/50 last:border-0">
                  <span className="text-xs text-[var(--color-text-muted)]">{desc}</span>
                  <kbd className="px-2 py-0.5 text-[10px] font-mono bg-[var(--color-surface-overlay)] border border-[var(--color-border)] rounded">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
