import { create } from 'zustand'
import type {
  SensorWidget,
  ColorFilter,
  ExclusionZone,
  TreatmentSensor,
} from '../types/config'

interface AppendageState {
  // Sensor widget
  sensor: SensorWidget
  standardSpace: { width: number; height: number }

  // Filters
  filters: ColorFilter

  // Background
  background: { slowWindow: number; fastWindow: number }

  // Exclusion zones
  exclusionZones: ExclusionZone[]

  // Treatment sensor
  treatmentSensor: TreatmentSensor

  // Preview state
  sensorPreview: ImageData | null
  filteredPreview: ImageData | null
  backgroundPreview: ImageData | null

  // Actions
  setSensor: (sensor: Partial<SensorWidget>) => void
  setFilters: (filters: Partial<ColorFilter>) => void
  setBackground: (bg: Partial<{ slowWindow: number; fastWindow: number }>) => void
  addExclusionZone: (zone: ExclusionZone) => void
  removeExclusionZone: (index: number) => void
  setTreatmentSensor: (sensor: Partial<TreatmentSensor>) => void
  setSensorPreview: (preview: ImageData | null) => void
  setFilteredPreview: (preview: ImageData | null) => void
  setBackgroundPreview: (preview: ImageData | null) => void
}

export const useAppendageStore = create<AppendageState>((set) => ({
  sensor: {
    centerX: 200,
    centerY: 200,
    width: 200,
    height: 200,
    rotationDeg: 0,
    scaleX: 1,
    scaleY: 1,
  },
  standardSpace: { width: 200, height: 200 },
  filters: {
    colorSpace: 'HSL',
    hueMin: 0,
    hueMax: 360,
    saturationMin: 0,
    saturationMax: 100,
    lightnessMin: 0,
    lightnessMax: 45,
  },
  background: { slowWindow: 30, fastWindow: 3 },
  exclusionZones: [],
  treatmentSensor: { enabled: false, x: 0, y: 0, width: 40, height: 40 },
  sensorPreview: null,
  filteredPreview: null,
  backgroundPreview: null,

  setSensor: (partial) =>
    set((s) => ({ sensor: { ...s.sensor, ...partial } })),

  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),

  setBackground: (partial) =>
    set((s) => ({ background: { ...s.background, ...partial } })),

  addExclusionZone: (zone) =>
    set((s) => ({ exclusionZones: [...s.exclusionZones, zone] })),

  removeExclusionZone: (index) =>
    set((s) => ({
      exclusionZones: s.exclusionZones.filter((_, i) => i !== index),
    })),

  setTreatmentSensor: (partial) =>
    set((s) => ({ treatmentSensor: { ...s.treatmentSensor, ...partial } })),

  setSensorPreview: (sensorPreview) => set({ sensorPreview }),
  setFilteredPreview: (filteredPreview) => set({ filteredPreview }),
  setBackgroundPreview: (backgroundPreview) => set({ backgroundPreview }),
}))
