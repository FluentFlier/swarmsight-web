/**
 * RGB <-> HSL conversion matching original SwarmSight HSLcolor.cs
 * H: 0-360, S: 0-100, L: 0-100
 */

export interface HSL {
  h: number
  s: number
  l: number
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    } else if (max === g) {
      h = ((b - r) / d + 2) / 6
    } else {
      h = ((r - g) / d + 4) / 6
    }
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  }
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  s /= 100
  l /= 100

  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

/**
 * Apply HSL filter to ImageData in-place.
 * Pixels passing the filter are white, failing are black.
 * Returns the filtered ImageData as a binary mask.
 */
export function applyHslFilter(
  imageData: ImageData,
  hueMin: number,
  hueMax: number,
  satMin: number,
  satMax: number,
  lightMin: number,
  lightMax: number
): ImageData {
  const { data, width, height } = imageData
  const output = new ImageData(width, height)
  const out = output.data

  for (let i = 0; i < data.length; i += 4) {
    const hsl = rgbToHsl(data[i], data[i + 1], data[i + 2])

    let huePass: boolean
    if (hueMin <= hueMax) {
      huePass = hsl.h >= hueMin && hsl.h <= hueMax
    } else {
      // Wrap-around (e.g., 350 to 10)
      huePass = hsl.h >= hueMin || hsl.h <= hueMax
    }

    const pass =
      huePass &&
      hsl.s >= satMin &&
      hsl.s <= satMax &&
      hsl.l >= lightMin &&
      hsl.l <= lightMax

    if (pass) {
      out[i] = 255
      out[i + 1] = 255
      out[i + 2] = 255
      out[i + 3] = 255
    } else {
      out[i] = 0
      out[i + 1] = 0
      out[i + 2] = 0
      out[i + 3] = 255
    }
  }

  return output
}
