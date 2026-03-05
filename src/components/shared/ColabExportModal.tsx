import { useState } from 'react'
import { ExternalLink, Copy, Check, X } from 'lucide-react'

interface ColabExportModalProps {
  isOpen: boolean
  onClose: () => void
}

const COLAB_URL = 'https://colab.research.google.com/github/FluentFlier/swarmsight-web/blob/master/colab/swarmsight_notebook.ipynb'

const STEPS = [
  'Export your config JSON using the "Export Config JSON" button in the sidebar',
  'Upload your video files to Google Drive',
  'Update the video paths in config.json to match your Drive paths (e.g., /content/drive/MyDrive/Videos/myfile.mp4)',
  'Open the Colab notebook using the button below',
  'Upload your config.json when prompted',
  'Run all cells to process your videos',
  'Download the resulting CSV files, or find them next to your videos in Drive',
  'Import the CSVs back into SwarmSight Web for visualization',
]

export function ColabExportModal({ isOpen, onClose }: ColabExportModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const copyUrl = () => {
    navigator.clipboard.writeText(COLAB_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl shadow-2xl w-[500px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold">Export to Google Colab</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--color-surface-overlay)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            For full-resolution batch processing, use the Google Colab backend.
            It processes videos using GPU acceleration and produces CSVs matching
            the original SwarmSight format.
          </p>

          <div className="flex flex-col gap-2">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold text-[10px]">
                  {i + 1}
                </span>
                <span className="text-[var(--color-text-muted)] pt-0.5">{step}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <a
              href={COLAB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 flex-1 px-3 py-2 text-xs font-medium rounded-lg
                bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors text-center justify-center"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Colab
            </a>
            <button
              onClick={copyUrl}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg
                bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-success)]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
