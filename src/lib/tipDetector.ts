/**
 * Antenna tip detection algorithm.
 * Finds the furthest active pixel cluster from the base point
 * within the antenna hull region.
 */

export interface TipPosition {
  x: number
  y: number
  confidence: number  // 0-1, based on pixel count in region
}

export interface TrackingResult {
  leftTip: TipPosition | null
  rightTip: TipPosition | null
  proboscisTip: TipPosition | null
  leftSector: number
  rightSector: number
  leftAngle: number
  rightAngle: number
  treatmentValue: number
}

/**
 * Find the tip position in a binary mask within a hull region.
 * Strategy: find the furthest active pixel cluster from the base point.
 *
 * @param mask        Binary mask (white = active)
 * @param baseX       Base point X
 * @param baseY       Base point Y
 * @param hull        Convex hull boundary
 * @param tailPercent Only consider top X% most distant pixels (default 4%)
 * @returns Tip position or null if no active pixels found
 */
export function detectTip(
  mask: ImageData,
  baseX: number,
  baseY: number,
  hull: { x: number; y: number }[],
  tailPercent: number = 0.04
): TipPosition | null {
  const { data, width, height } = mask

  // Collect active pixels in hull with their distances from base
  const activePixels: { x: number; y: number; dist: number }[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      if (data[idx] < 128) continue

      if (!isInHull(x, y, hull)) continue

      const dist = Math.sqrt((x - baseX) ** 2 + (y - baseY) ** 2)
      activePixels.push({ x, y, dist })
    }
  }

  if (activePixels.length === 0) return null

  // Sort by distance descending, take top tailPercent
  activePixels.sort((a, b) => b.dist - a.dist)
  const tailCount = Math.max(1, Math.floor(activePixels.length * tailPercent))
  const tailPixels = activePixels.slice(0, tailCount)

  // Tip = centroid of tail pixels
  let sumX = 0, sumY = 0
  for (const p of tailPixels) {
    sumX += p.x
    sumY += p.y
  }

  return {
    x: sumX / tailPixels.length,
    y: sumY / tailPixels.length,
    confidence: Math.min(1, activePixels.length / 100),
  }
}

/**
 * Detect proboscis extension by counting active pixels in the proboscis hull.
 * Returns a tip position if extension is detected.
 */
export function detectProboscis(
  mask: ImageData,
  hull: { x: number; y: number }[]
): TipPosition | null {
  const { data, width, height } = mask
  let count = 0
  let sumX = 0, sumY = 0
  let maxY = 0, maxYx = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      if (data[idx] < 128) continue
      if (!isInHull(x, y, hull)) continue

      count++
      sumX += x
      sumY += y

      if (y > maxY) {
        maxY = y
        maxYx = x
      }
    }
  }

  if (count < 10) return null

  // Tip is the lowest (highest Y) active pixel
  return {
    x: maxYx,
    y: maxY,
    confidence: Math.min(1, count / 50),
  }
}

/**
 * Apply exponential moving average smoothing to tip position.
 */
export function smoothTip(
  current: TipPosition | null,
  previous: TipPosition | null,
  alpha: number = 0.3
): TipPosition | null {
  if (!current) return previous
  if (!previous) return current

  return {
    x: alpha * current.x + (1 - alpha) * previous.x,
    y: alpha * current.y + (1 - alpha) * previous.y,
    confidence: current.confidence,
  }
}

/**
 * Read treatment sensor value: sum of pixel intensities in region.
 */
export function readTreatmentSensor(
  frameData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): number {
  const { data, width: imgWidth } = frameData
  let sum = 0

  const x1 = Math.max(0, x)
  const y1 = Math.max(0, y)
  const x2 = Math.min(imgWidth, x + width)
  const y2 = Math.min(frameData.height, y + height)

  for (let py = y1; py < y2; py++) {
    for (let px = x1; px < x2; px++) {
      const idx = (py * imgWidth + px) * 4
      sum += data[idx] + data[idx + 1] + data[idx + 2]
    }
  }

  return sum
}

function isInHull(px: number, py: number, hull: { x: number; y: number }[]): boolean {
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
