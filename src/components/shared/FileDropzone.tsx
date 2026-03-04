import { useCallback, useState, useRef } from 'react'
import { Upload, Film, AlertTriangle } from 'lucide-react'
import { useVideoStore } from '../../stores/videoStore'
import type { VideoMetadata } from '../../types/video'

const ACCEPTED_FORMATS = ['.mp4', '.webm', '.mov', '.avi', '.mkv']
const ESTIMATED_FPS = 30

export function FileDropzone() {
  const loadVideo = useVideoStore((s) => s.loadVideo)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      setLoading(true)

      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ACCEPTED_FORMATS.includes(ext)) {
        setError(`Unsupported format: ${ext}. Use MP4, WebM, MOV, AVI, or MKV.`)
        setLoading(false)
        return
      }

      const objectUrl = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'

      try {
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve()
          video.onerror = () => reject(new Error('Could not load video. Format may not be supported by this browser.'))
          video.src = objectUrl
        })

        // Try to detect FPS — browsers don't expose this directly
        // Use a reasonable default
        const fps = ESTIMATED_FPS
        const duration = video.duration
        const totalFrames = Math.round(duration * fps)

        const metadata: VideoMetadata = {
          fileName: file.name,
          fileSize: file.size,
          width: video.videoWidth,
          height: video.videoHeight,
          duration,
          fps,
          totalFrames,
          objectUrl,
        }

        loadVideo(metadata)
      } catch (err) {
        URL.revokeObjectURL(objectUrl)
        setError(err instanceof Error ? err.message : 'Failed to load video')
      } finally {
        setLoading(false)
      }
    },
    [loadVideo]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback(() => setIsDragOver(false), [])

  const onClick = useCallback(() => inputRef.current?.click(), [])

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={onClick}
        className={`
          flex flex-col items-center justify-center gap-4 w-full max-w-lg
          border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all
          ${isDragOver
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
            : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
          }
        `}
      >
        {loading ? (
          <>
            <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--color-text-muted)]">Loading video...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-overlay)] flex items-center justify-center">
              {isDragOver ? (
                <Film className="w-6 h-6 text-[var(--color-accent)]" />
              ) : (
                <Upload className="w-6 h-6 text-[var(--color-text-muted)]" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragOver ? 'Drop video here' : 'Drop a video file or click to browse'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                MP4, WebM, MOV, AVI, MKV
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
          <AlertTriangle className="w-4 h-4 text-[var(--color-error)] shrink-0" />
          <p className="text-xs text-[var(--color-error)]">{error}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  )
}
