export type ModuleType = 'appendage_tracker' | 'motion_analyzer'

export interface VideoRef {
  id: string
  path: string
  fps: number
  width: number
  height: number
  totalFrames: number
}

export interface SensorWidget {
  centerX: number
  centerY: number
  width: number
  height: number
  rotationDeg: number
  scaleX: number
  scaleY: number
}

export interface ColorFilter {
  colorSpace: 'HSL'
  hueMin: number
  hueMax: number
  saturationMin: number
  saturationMax: number
  lightnessMin: number
  lightnessMax: number
}

export interface ExclusionZone {
  x: number
  y: number
  width: number
  height: number
}

export interface TreatmentSensor {
  enabled: boolean
  x: number
  y: number
  width: number
  height: number
}

export interface AppendageTrackerConfig {
  sensorWidget: SensorWidget
  standardSpace: { width: number; height: number }
  filters: ColorFilter
  background: { slowWindow: number; fastWindow: number }
  exclusionZones: ExclusionZone[]
  treatmentSensor: TreatmentSensor
  priors: { useDefaultBee: boolean; customHullPath: string | null }
  tipDetection: { sectorCount: number; tailPercent: number; smoothingAlpha: number }
}

export interface MotionAnalyzerConfig {
  threshold: number
  roi: { leftPct: number; topPct: number; rightPct: number; bottomPct: number }
  shadeRadius: number
  showMotion: boolean
}

export interface TipCorrection {
  x: number
  y: number
}

export interface FrameCorrections {
  leftTip: TipCorrection | null
  rightTip: TipCorrection | null
  proboscisTip: TipCorrection | null
}

export interface SwarmSightConfig {
  version: string
  createdAt: string
  tool: 'swarmsight-web'
  module: ModuleType
  videos: VideoRef[]
  appendageTracker?: AppendageTrackerConfig
  motionAnalyzer?: MotionAnalyzerConfig
  corrections: Record<string, Record<string, FrameCorrections>>
}
