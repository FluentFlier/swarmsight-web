/**
 * Convex hull priors for antenna region segmentation.
 * Default bee priors (Apis mellifera) are bundled.
 * Researchers can generate custom priors via calibration.
 */

export interface PriorPoint {
  x: number
  y: number
  region: 'left_antenna' | 'right_antenna' | 'proboscis' | 'head'
}

export interface ConvexHullPriors {
  leftAntennaHull: { x: number; y: number }[]
  rightAntennaHull: { x: number; y: number }[]
  proboscisHull: { x: number; y: number }[]
  leftBase: { x: number; y: number }
  rightBase: { x: number; y: number }
}

/**
 * Default bee priors in normalized coordinates (0-1 range).
 * Computed from hand-annotated Apis mellifera data.
 * These map to standard space (200x200) via simple scaling.
 */
export const DEFAULT_BEE_PRIORS: ConvexHullPriors = {
  leftAntennaHull: [
    { x: 0.1, y: 0.05 },
    { x: 0.45, y: 0.05 },
    { x: 0.5, y: 0.35 },
    { x: 0.45, y: 0.45 },
    { x: 0.1, y: 0.45 },
  ],
  rightAntennaHull: [
    { x: 0.55, y: 0.05 },
    { x: 0.9, y: 0.05 },
    { x: 0.9, y: 0.45 },
    { x: 0.55, y: 0.45 },
    { x: 0.5, y: 0.35 },
  ],
  proboscisHull: [
    { x: 0.3, y: 0.55 },
    { x: 0.7, y: 0.55 },
    { x: 0.7, y: 0.95 },
    { x: 0.3, y: 0.95 },
  ],
  leftBase: { x: 0.42, y: 0.4 },
  rightBase: { x: 0.58, y: 0.4 },
}

/**
 * Scale normalized priors to standard space dimensions.
 */
export function scalePriors(
  priors: ConvexHullPriors,
  width: number,
  height: number
): ConvexHullPriors {
  const scalePoint = (p: { x: number; y: number }) => ({
    x: p.x * width,
    y: p.y * height,
  })

  return {
    leftAntennaHull: priors.leftAntennaHull.map(scalePoint),
    rightAntennaHull: priors.rightAntennaHull.map(scalePoint),
    proboscisHull: priors.proboscisHull.map(scalePoint),
    leftBase: scalePoint(priors.leftBase),
    rightBase: scalePoint(priors.rightBase),
  }
}

/**
 * Check if a point is inside a convex hull (polygon) using ray casting.
 */
export function pointInHull(
  px: number,
  py: number,
  hull: { x: number; y: number }[]
): boolean {
  let inside = false
  for (let i = 0, j = hull.length - 1; i < hull.length; j = i++) {
    const xi = hull[i].x, yi = hull[i].y
    const xj = hull[j].x, yj = hull[j].y

    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Parse custom priorPoints CSV (from calibration notebook).
 * Format: x,y,region
 */
export function parsePriorPointsCSV(text: string): PriorPoint[] {
  const lines = text.trim().split('\n')
  const points: PriorPoint[] = []

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map((s) => s.trim())
    if (parts.length >= 3) {
      points.push({
        x: parseFloat(parts[0]),
        y: parseFloat(parts[1]),
        region: parts[2] as PriorPoint['region'],
      })
    }
  }

  return points
}
