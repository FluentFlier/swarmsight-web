/**
 * Angular sector histogram for antenna tip detection.
 * Divides the antenna region into radial sectors around the base point,
 * counts active pixels per sector to find the dominant direction.
 */

export interface SectorResult {
  sectorIndex: number
  angle: number       // radians
  pixelCount: number
}

/**
 * Compute angular sector histogram.
 * Active pixels are those that are white (255) in the binary mask.
 *
 * @param mask      Binary mask ImageData (white = active)
 * @param baseX     Base point X in mask coordinates
 * @param baseY     Base point Y in mask coordinates
 * @param hull      Convex hull boundary (only count pixels inside)
 * @param sectorCount Number of angular sectors (default 20)
 * @returns Array of sector results sorted by angle
 */
export function computeSectorHistogram(
  mask: ImageData,
  baseX: number,
  baseY: number,
  hull: { x: number; y: number }[],
  sectorCount: number = 20
): SectorResult[] {
  const { data, width, height } = mask
  const sectorAngle = (2 * Math.PI) / sectorCount
  const counts = new Array(sectorCount).fill(0)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      if (data[idx] < 128) continue // not active

      // Check if inside hull
      if (!isInHull(x, y, hull)) continue

      // Compute angle from base
      const dx = x - baseX
      const dy = y - baseY
      let angle = Math.atan2(dy, dx)
      if (angle < 0) angle += 2 * Math.PI

      const sector = Math.floor(angle / sectorAngle) % sectorCount
      counts[sector]++
    }
  }

  return counts.map((count, i) => ({
    sectorIndex: i,
    angle: i * sectorAngle + sectorAngle / 2,
    pixelCount: count,
  }))
}

/**
 * Find the dominant sector (most active pixels).
 */
export function findDominantSector(sectors: SectorResult[]): SectorResult | null {
  if (sectors.length === 0) return null
  return sectors.reduce((best, s) => (s.pixelCount > best.pixelCount ? s : best))
}

// Inline point-in-polygon for performance
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
