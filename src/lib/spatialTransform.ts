/**
 * Extract sensor region from a video frame using affine transform.
 * Maps from original video space to standard space (200x200 default).
 */

import type { SensorWidget } from '../types/config'

export function extractSensorRegion(
  sourceCanvas: HTMLCanvasElement | OffscreenCanvas,
  sensor: SensorWidget,
  standardWidth: number,
  standardHeight: number
): ImageData {
  const offscreen = new OffscreenCanvas(standardWidth, standardHeight)
  const ctx = offscreen.getContext('2d')!

  // Build transform: standard space center -> rotate -> scale -> translate to sensor center
  ctx.save()
  ctx.translate(standardWidth / 2, standardHeight / 2)
  ctx.rotate((-sensor.rotationDeg * Math.PI) / 180)
  ctx.scale(1 / sensor.scaleX, 1 / sensor.scaleY)
  ctx.translate(-sensor.centerX, -sensor.centerY)

  ctx.drawImage(sourceCanvas, 0, 0)
  ctx.restore()

  return ctx.getImageData(0, 0, standardWidth, standardHeight)
}

/**
 * Convert a point from standard space back to video space.
 */
export function standardToVideo(
  sx: number,
  sy: number,
  sensor: SensorWidget,
  standardWidth: number,
  standardHeight: number
): { x: number; y: number } {
  // Offset from center of standard space
  const dx = sx - standardWidth / 2
  const dy = sy - standardHeight / 2

  // Apply scale
  const scaledX = dx * sensor.scaleX
  const scaledY = dy * sensor.scaleY

  // Apply rotation
  const angle = (sensor.rotationDeg * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const rotX = scaledX * cos - scaledY * sin
  const rotY = scaledX * sin + scaledY * cos

  return {
    x: rotX + sensor.centerX,
    y: rotY + sensor.centerY,
  }
}
