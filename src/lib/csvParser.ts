import type { MotionDataPoint } from '../stores/motionStore'

export function motionDataToCSV(data: MotionDataPoint[]): string {
  const lines = ['Frame, Changed Pixels']
  for (const point of data) {
    lines.push(`${point.frame}, ${point.changedPixels}`)
  }
  return lines.join('\n')
}

export function parseMotionCSV(text: string): MotionDataPoint[] {
  const lines = text.trim().split('\n')
  const data: MotionDataPoint[] = []

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map((s) => s.trim())
    if (parts.length >= 2) {
      const frame = parseInt(parts[0], 10)
      const changedPixels = parseInt(parts[1], 10)
      if (!isNaN(frame) && !isNaN(changedPixels)) {
        data.push({ frame, changedPixels })
      }
    }
  }

  return data
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
