import { useCallback, useRef, useState, useEffect } from 'react'
import { useAppendageStore } from '../../stores/appendageStore'
import { useVideoStore } from '../../stores/videoStore'

type DragMode = 'none' | 'move' | 'rotate' | 'scale-tl' | 'scale-tr' | 'scale-bl' | 'scale-br'

export function SensorWidget() {
  const sensor = useAppendageStore((s) => s.sensor)
  const setSensor = useAppendageStore((s) => s.setSensor)
  const video = useVideoStore((s) => s.video)

  const [dragMode, setDragMode] = useState<DragMode>('none')
  const dragStart = useRef({ x: 0, y: 0, sensor: { ...sensor } })
  const svgRef = useRef<SVGSVGElement>(null)

  if (!video) return null

  const { centerX, centerY, width, height, rotationDeg, scaleX, scaleY } = sensor
  const halfW = (width * scaleX) / 2
  const halfH = (height * scaleY) / 2
  const handleSize = 8

  // Convert client coords to SVG coords
  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: clientX, y: clientY }
    const rect = svg.getBoundingClientRect()
    const svgW = video!.width
    const svgH = video!.height
    return {
      x: ((clientX - rect.left) / rect.width) * svgW,
      y: ((clientY - rect.top) / rect.height) * svgH,
    }
  }

  const onMouseDown = (mode: DragMode) => (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const pt = toSvg(e.clientX, e.clientY)
    dragStart.current = { x: pt.x, y: pt.y, sensor: { ...sensor } }
    setDragMode(mode)
  }

  useEffect(() => {
    if (dragMode === 'none') return

    const onMouseMove = (e: MouseEvent) => {
      const pt = toSvg(e.clientX, e.clientY)
      const dx = pt.x - dragStart.current.x
      const dy = pt.y - dragStart.current.y
      const orig = dragStart.current.sensor

      switch (dragMode) {
        case 'move':
          setSensor({ centerX: orig.centerX + dx, centerY: orig.centerY + dy })
          break

        case 'rotate': {
          const startAngle = Math.atan2(
            dragStart.current.y - orig.centerY,
            dragStart.current.x - orig.centerX
          )
          const currentAngle = Math.atan2(
            pt.y - orig.centerY,
            pt.x - orig.centerX
          )
          const delta = ((currentAngle - startAngle) * 180) / Math.PI
          setSensor({ rotationDeg: orig.rotationDeg + delta })
          break
        }

        case 'scale-br': {
          // Scale proportionally based on distance from center
          const origDist = Math.sqrt(
            (dragStart.current.x - orig.centerX) ** 2 +
            (dragStart.current.y - orig.centerY) ** 2
          )
          const newDist = Math.sqrt(
            (pt.x - orig.centerX) ** 2 +
            (pt.y - orig.centerY) ** 2
          )
          const ratio = origDist > 0 ? newDist / origDist : 1
          setSensor({
            scaleX: Math.max(0.2, orig.scaleX * ratio),
            scaleY: Math.max(0.2, orig.scaleY * ratio),
          })
          break
        }

        case 'scale-tl':
        case 'scale-tr':
        case 'scale-bl': {
          const origDist = Math.sqrt(
            (dragStart.current.x - orig.centerX) ** 2 +
            (dragStart.current.y - orig.centerY) ** 2
          )
          const newDist = Math.sqrt(
            (pt.x - orig.centerX) ** 2 +
            (pt.y - orig.centerY) ** 2
          )
          const ratio = origDist > 0 ? newDist / origDist : 1
          setSensor({
            scaleX: Math.max(0.2, orig.scaleX * ratio),
            scaleY: Math.max(0.2, orig.scaleY * ratio),
          })
          break
        }
      }
    }

    const onMouseUp = () => setDragMode('none')

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragMode, sensor, setSensor])

  // Keyboard fine-tuning
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const step = e.shiftKey ? 10 : 1
      switch (e.key) {
        case 'ArrowUp':
          if (e.altKey) { e.preventDefault(); setSensor({ centerY: sensor.centerY - step }) }
          break
        case 'ArrowDown':
          if (e.altKey) { e.preventDefault(); setSensor({ centerY: sensor.centerY + step }) }
          break
        case 'ArrowLeft':
          if (e.altKey) { e.preventDefault(); setSensor({ centerX: sensor.centerX - step }) }
          break
        case 'ArrowRight':
          if (e.altKey) { e.preventDefault(); setSensor({ centerX: sensor.centerX + step }) }
          break
        case 'r':
          e.preventDefault()
          setSensor({ rotationDeg: sensor.rotationDeg + (e.shiftKey ? -5 : 5) })
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sensor, setSensor])

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${video.width} ${video.height}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <g transform={`rotate(${rotationDeg} ${centerX} ${centerY})`}>
        {/* Main rectangle */}
        <rect
          x={centerX - halfW}
          y={centerY - halfH}
          width={halfW * 2}
          height={halfH * 2}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="6 3"
          className="pointer-events-auto cursor-move"
          onMouseDown={onMouseDown('move')}
        />

        {/* Center crosshair */}
        <line x1={centerX - 6} y1={centerY} x2={centerX + 6} y2={centerY} stroke="#3b82f6" strokeWidth={1} />
        <line x1={centerX} y1={centerY - 6} x2={centerX} y2={centerY + 6} stroke="#3b82f6" strokeWidth={1} />

        {/* Corner scale handles */}
        {[
          { cx: centerX - halfW, cy: centerY - halfH, mode: 'scale-tl' as DragMode },
          { cx: centerX + halfW, cy: centerY - halfH, mode: 'scale-tr' as DragMode },
          { cx: centerX - halfW, cy: centerY + halfH, mode: 'scale-bl' as DragMode },
          { cx: centerX + halfW, cy: centerY + halfH, mode: 'scale-br' as DragMode },
        ].map(({ cx, cy, mode }) => (
          <rect
            key={mode}
            x={cx - handleSize / 2}
            y={cy - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="#3b82f6"
            stroke="#fff"
            strokeWidth={1}
            className="pointer-events-auto cursor-nwse-resize"
            onMouseDown={onMouseDown(mode)}
          />
        ))}

        {/* Rotation handle */}
        <line
          x1={centerX}
          y1={centerY - halfH}
          x2={centerX}
          y2={centerY - halfH - 25}
          stroke="#3b82f6"
          strokeWidth={1.5}
        />
        <circle
          cx={centerX}
          cy={centerY - halfH - 25}
          r={6}
          fill="#3b82f6"
          stroke="#fff"
          strokeWidth={1.5}
          className="pointer-events-auto cursor-grab"
          onMouseDown={onMouseDown('rotate')}
        />
      </g>
    </svg>
  )
}
