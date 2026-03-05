import { useCallback } from 'react'
import { FileJson, FileSpreadsheet } from 'lucide-react'
import { useVideoStore } from '../../stores/videoStore'
import { useAppendageStore } from '../../stores/appendageStore'
import { useMotionStore } from '../../stores/motionStore'
import { downloadJSON, motionDataToCSV, downloadCSV } from '../../lib/csvParser'
import type { SwarmSightConfig, ModuleType } from '../../types/config'

interface ExportButtonProps {
  activeModule: ModuleType
  corrections: Record<string, Record<string, { x: number; y: number }>>
}

export function ExportButton({ activeModule, corrections }: ExportButtonProps) {
  const video = useVideoStore((s) => s.video)
  const sensor = useAppendageStore((s) => s.sensor)
  const filters = useAppendageStore((s) => s.filters)
  const background = useAppendageStore((s) => s.background)
  const exclusionZones = useAppendageStore((s) => s.exclusionZones)
  const treatmentSensor = useAppendageStore((s) => s.treatmentSensor)
  const standardSpace = useAppendageStore((s) => s.standardSpace)
  const motionData = useMotionStore((s) => s.motionData)
  const threshold = useMotionStore((s) => s.threshold)
  const roi = useMotionStore((s) => s.roi)

  const exportConfig = useCallback(() => {
    if (!video) return

    const config: SwarmSightConfig = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      tool: 'swarmsight-web',
      module: activeModule,
      videos: [
        {
          id: 'vid_001',
          path: video.fileName,
          fps: video.fps,
          width: video.width,
          height: video.height,
          totalFrames: video.totalFrames,
        },
      ],
      corrections: {
        vid_001: Object.fromEntries(
          Object.entries(corrections).map(([frame, tipCorrections]) => [
            frame,
            {
              leftTip: tipCorrections['left_tip'] ?? null,
              rightTip: tipCorrections['right_tip'] ?? null,
              proboscisTip: tipCorrections['proboscis_tip'] ?? null,
            },
          ])
        ),
      },
    }

    if (activeModule === 'appendage_tracker') {
      config.appendageTracker = {
        sensorWidget: sensor,
        standardSpace,
        filters,
        background,
        exclusionZones,
        treatmentSensor,
        priors: { useDefaultBee: true, customHullPath: null },
        tipDetection: { sectorCount: 20, tailPercent: 0.04, smoothingAlpha: 0.3 },
      }
    } else {
      config.motionAnalyzer = {
        threshold,
        roi,
        shadeRadius: 1,
        showMotion: true,
      }
    }

    const name = video.fileName.replace(/\.[^.]+$/, '')
    downloadJSON(config, `${name}_swarmsight_config.json`)
  }, [video, activeModule, sensor, filters, background, exclusionZones, treatmentSensor, standardSpace, threshold, roi, corrections])

  const exportMotionCSV = useCallback(() => {
    if (motionData.length === 0) return
    const name = video?.fileName?.replace(/\.[^.]+$/, '') || 'motion'
    downloadCSV(motionDataToCSV(motionData), `${name}_motion.csv`)
  }, [motionData, video])

  return (
    <div className="flex flex-col gap-1.5 p-4 border-t border-[var(--color-border)]">
      <button
        onClick={exportConfig}
        disabled={!video}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-lg
          bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-30
          disabled:cursor-not-allowed transition-colors"
      >
        <FileJson className="w-3.5 h-3.5" />
        Export Config JSON
      </button>

      {activeModule === 'motion_analyzer' && motionData.length > 0 && (
        <button
          onClick={exportMotionCSV}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-lg
            bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Export Motion CSV
        </button>
      )}
    </div>
  )
}
