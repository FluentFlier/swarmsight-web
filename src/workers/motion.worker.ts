// Motion detection Web Worker
// Receives frame image data, computes pixel-wise difference, returns motion mask + count

export interface MotionRequest {
  type: 'process'
  currentFrame: Uint8ClampedArray
  previousFrame: Uint8ClampedArray
  width: number
  height: number
  threshold: number
  roi: { leftPct: number; topPct: number; rightPct: number; bottomPct: number }
}

export interface MotionResponse {
  type: 'result'
  changedPixels: number
  motionMask: Uint8ClampedArray
  width: number
  height: number
}

self.onmessage = (e: MessageEvent<MotionRequest>) => {
  const { currentFrame, previousFrame, width, height, threshold, roi } = e.data

  const roiLeft = Math.floor(roi.leftPct * width)
  const roiTop = Math.floor(roi.topPct * height)
  const roiRight = Math.floor(roi.rightPct * width)
  const roiBottom = Math.floor(roi.bottomPct * height)

  // Output: RGBA mask where motion pixels are highlighted
  const motionMask = new Uint8ClampedArray(width * height * 4)
  let changedPixels = 0

  for (let y = roiTop; y < roiBottom; y++) {
    for (let x = roiLeft; x < roiRight; x++) {
      const idx = (y * width + x) * 4

      // Grayscale difference (average of RGB channels)
      const dr = Math.abs(currentFrame[idx] - previousFrame[idx])
      const dg = Math.abs(currentFrame[idx + 1] - previousFrame[idx + 1])
      const db = Math.abs(currentFrame[idx + 2] - previousFrame[idx + 2])
      const diff = (dr + dg + db) / 3

      if (diff > threshold) {
        changedPixels++
        // Yellow-orange motion highlight
        motionMask[idx] = 255     // R
        motionMask[idx + 1] = 200 // G
        motionMask[idx + 2] = 0   // B
        motionMask[idx + 3] = 140 // A (semi-transparent)
      }
    }
  }

  const response: MotionResponse = {
    type: 'result',
    changedPixels,
    motionMask,
    width,
    height,
  }

  ;(self as unknown as Worker).postMessage(response, [motionMask.buffer] as unknown as Transferable[])
}
