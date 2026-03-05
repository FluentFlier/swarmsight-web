import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'

const TIPS = [
  { target: 'dropzone', title: 'Load a Video', text: 'Drag and drop a video file or click to browse. MP4, WebM, MOV supported.' },
  { target: 'tabs', title: 'Choose a Module', text: 'Motion Analyzer detects movement. Appendage Tracker follows antenna tips.' },
  { target: 'controls', title: 'Navigate Frames', text: 'Use Space to play/pause, comma/period to step frames, arrow keys to seek.' },
  { target: 'sidebar', title: 'Configure & Export', text: 'Adjust settings in the sidebar. Export config JSON for Colab batch processing.' },
]

const STORAGE_KEY = 'swarmsight-onboarding-done'

export function OnboardingTooltip() {
  const [step, setStep] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      setDismissed(true)
    }
  }, [])

  if (dismissed || step >= TIPS.length) return null

  const tip = TIPS[step]

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  const next = () => {
    if (step < TIPS.length - 1) {
      setStep(step + 1)
    } else {
      dismiss()
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl shadow-2xl px-4 py-3 max-w-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold">{tip.title}</div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{tip.text}</p>
          </div>
          <button onClick={dismiss} className="p-0.5 rounded hover:bg-[var(--color-surface-overlay)]">
            <X className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1">
            {TIPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded
              bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
          >
            {step < TIPS.length - 1 ? 'Next' : 'Done'}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
