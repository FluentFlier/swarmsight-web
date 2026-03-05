import { create } from 'zustand'

export interface MotionDataPoint {
  frame: number
  changedPixels: number
}

interface MotionState {
  // Settings
  threshold: number
  roi: { leftPct: number; topPct: number; rightPct: number; bottomPct: number }
  showMotion: boolean
  isProcessing: boolean

  // Results
  motionData: MotionDataPoint[]
  currentMotionMask: ImageData | null

  // Actions
  setThreshold: (t: number) => void
  setRoi: (roi: { leftPct: number; topPct: number; rightPct: number; bottomPct: number }) => void
  setShowMotion: (show: boolean) => void
  setProcessing: (p: boolean) => void
  addMotionDataPoint: (point: MotionDataPoint) => void
  setCurrentMotionMask: (mask: ImageData | null) => void
  clearMotionData: () => void
  setMotionData: (data: MotionDataPoint[]) => void
}

export const useMotionStore = create<MotionState>((set) => ({
  threshold: 30,
  roi: { leftPct: 0, topPct: 0, rightPct: 1, bottomPct: 1 },
  showMotion: true,
  isProcessing: false,
  motionData: [],
  currentMotionMask: null,

  setThreshold: (threshold) => set({ threshold }),
  setRoi: (roi) => set({ roi }),
  setShowMotion: (showMotion) => set({ showMotion }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  addMotionDataPoint: (point) =>
    set((s) => ({ motionData: [...s.motionData, point] })),
  setCurrentMotionMask: (currentMotionMask) => set({ currentMotionMask }),
  clearMotionData: () => set({ motionData: [], currentMotionMask: null }),
  setMotionData: (motionData) => set({ motionData }),
}))
