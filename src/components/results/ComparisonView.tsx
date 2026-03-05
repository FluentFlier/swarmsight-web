import { useState, useRef, useCallback } from 'react'
import { Upload, BarChart3, AlertTriangle } from 'lucide-react'
import { ActivityChart } from './ActivityChart'
import { parseMotionCSV } from '../../lib/csvParser'
import { blockData, tTest, permutationTest, mannWhitneyU, autocorrelation } from '../../lib/statistics'
import { useMotionStore } from '../../stores/motionStore'
import { useVideoStore } from '../../stores/videoStore'
import type { MotionDataPoint } from '../../stores/motionStore'
import type { StatResult } from '../../lib/statistics'

const BIN_SIZES = [
  { label: '1s', getSize: (fps: number) => fps },
  { label: '5s', getSize: (fps: number) => fps * 5 },
  { label: '30s', getSize: (fps: number) => fps * 30 },
]

export function ComparisonView() {
  const motionData = useMotionStore((s) => s.motionData)
  const video = useVideoStore((s) => s.video)
  const [comparisonData, setComparisonData] = useState<MotionDataPoint[] | null>(null)
  const [comparisonName, setComparisonName] = useState('')
  const [binIndex, setBinIndex] = useState(0)
  const [stats, setStats] = useState<StatResult[] | null>(null)
  const [autoCorr, setAutoCorr] = useState<number | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const data = parseMotionCSV(text)
    if (data.length > 0) {
      setComparisonData(data)
      setComparisonName(file.name)
    }
    e.target.value = ''
  }, [])

  const runTests = useCallback(() => {
    if (!comparisonData || motionData.length === 0) return
    const fps = video?.fps || 30
    const binSize = BIN_SIZES[binIndex].getSize(fps)

    const values1 = motionData.map((d) => d.changedPixels)
    const values2 = comparisonData.map((d) => d.changedPixels)

    // Blocked means
    const blocked1 = blockData(values1, binSize)
    const blocked2 = blockData(values2, binSize)

    if (blocked1.length < 3 || blocked2.length < 3) {
      setStats([{ testName: 'Error', statistic: 0, pValue: 1, warning: 'Not enough bins for analysis. Try a smaller bin size.' }])
      return
    }

    const results: StatResult[] = [
      tTest(blocked1, blocked2),
      permutationTest(blocked1, blocked2),
      mannWhitneyU(blocked1, blocked2),
    ]

    // Autocorrelation check on frame-level data
    const ac = autocorrelation(values1)
    setAutoCorr(ac)

    setStats(results)
  }, [comparisonData, motionData, video, binIndex])

  if (motionData.length === 0) {
    return (
      <div className="p-4 text-xs text-[var(--color-text-muted)]">
        Analyze a video first to enable comparison.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Statistical Comparison
      </h3>

      {/* Import comparison CSV */}
      {!comparisonData ? (
        <button
          onClick={() => importRef.current?.click()}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-lg
            bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Load comparison CSV
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)]">Comparing with:</span>
            <span className="truncate max-w-32">{comparisonName}</span>
          </div>

          {/* Overlay chart */}
          <ActivityChart
            comparisonData={comparisonData}
            comparisonLabel={comparisonName}
            height={150}
          />

          {/* Bin size selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">Bin size:</span>
            {BIN_SIZES.map((bin, i) => (
              <button
                key={bin.label}
                onClick={() => setBinIndex(i)}
                className={`px-2 py-0.5 text-xs rounded ${
                  i === binIndex
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                    : 'bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                } transition-colors`}
              >
                {bin.label}
              </button>
            ))}
          </div>

          {/* Run tests */}
          <button
            onClick={runTests}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-lg
              bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Run Statistical Tests
          </button>

          {/* Results */}
          {stats && (
            <div className="flex flex-col gap-2 mt-2">
              {autoCorr !== null && autoCorr > 0.5 && (
                <div className="flex items-start gap-2 px-2 py-1.5 rounded bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[var(--color-warning)]">
                    High temporal autocorrelation detected (r={autoCorr.toFixed(2)}). Use blocked analysis above rather than frame-level statistics.
                  </p>
                </div>
              )}

              {stats.map((result, i) => (
                <div key={i} className="px-2 py-1.5 rounded bg-[var(--color-surface-overlay)] text-xs">
                  <div className="font-medium">{result.testName}</div>
                  <div className="flex gap-3 mt-1 text-[var(--color-text-muted)]">
                    <span>stat={result.statistic.toFixed(3)}</span>
                    <span className={result.pValue < 0.05 ? 'text-[var(--color-success)]' : ''}>
                      p={result.pValue < 0.001 ? '<0.001' : result.pValue.toFixed(3)}
                    </span>
                    {result.effectSize !== undefined && (
                      <span>d={result.effectSize.toFixed(2)}</span>
                    )}
                  </div>
                  {result.warning && (
                    <div className="mt-1 text-[10px] text-[var(--color-warning)]">{result.warning}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setComparisonData(null)
              setStats(null)
              setAutoCorr(null)
            }}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Remove comparison
          </button>
        </div>
      )}

      <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
    </div>
  )
}
