import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'

export interface Callout {
  title: string
  subtitle?: string
  /** Anchor in the parent group's space (scene units), on the section face. */
  position: readonly [number, number, number]
}

const LABEL_GAP = 28
const LABEL_WIDTH = 170
const LABEL_SPACING = 46
const EDGE = 12
const INK = '#4a4f4e'

/**
 * Leader-line labels laid out in screen space every frame: dots track their 3D anchors, labels stack in a column
 * just right of the model's on-screen bounds, so rotating or zooming never detaches a label from its part.
 * Labels hide while the section face points away from the camera.
 */
export function SectionCallouts({ callouts, opacity, bounds }: {
  callouts: Callout[]
  opacity: number
  bounds: THREE.Object3D
}) {
  const size = useThree((state) => state.size)
  const markers = useRef<(THREE.Object3D | null)[]>([])
  const lines = useRef<(SVGPolylineElement | null)[]>([])
  const dots = useRef<(SVGCircleElement | null)[]>([])
  const labels = useRef<(HTMLDivElement | null)[]>([])
  const scratch = useMemo(
    () => ({ box: new THREE.Box3(), point: new THREE.Vector3(), normal: new THREE.Vector3(), rotation: new THREE.Quaternion() }),
    [],
  )

  useFrame(({ camera }) => {
    const { width, height } = size
    const project = (point: THREE.Vector3) => {
      point.project(camera)
      return [((point.x + 1) / 2) * width, ((1 - point.y) / 2) * height] as const
    }

    const { box, point, normal, rotation } = scratch
    box.setFromObject(bounds)
    let right = -Infinity
    for (let corner = 0; corner < 8; corner++) {
      point.set(
        corner & 1 ? box.max.x : box.min.x,
        corner & 2 ? box.max.y : box.min.y,
        corner & 4 ? box.max.z : box.min.z,
      )
      right = Math.max(right, project(point)[0])
    }
    const column = Math.min(right + LABEL_GAP, width - LABEL_WIDTH - EDGE)

    const placed = callouts
      .map((_, index) => {
        const marker = markers.current[index]
        if (!marker) return null
        marker.getWorldPosition(point)
        // Section face normal is the group's +Z (Blender cheek side).
        normal.set(0, 0, 1).applyQuaternion(marker.getWorldQuaternion(rotation))
        const facing = normal.dot(camera.position.clone().sub(point)) > 0
        const [x, y] = project(point)
        return { index, x, y, facing }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => a.y - b.y)

    let previousY = -Infinity
    for (const { index, x, y, facing } of placed) {
      const labelY = Math.max(y, previousY + LABEL_SPACING)
      previousY = labelY
      const display = facing ? '' : 'none'
      const line = lines.current[index]
      const dot = dots.current[index]
      const label = labels.current[index]
      const labelWidth = label?.offsetWidth ?? LABEL_WIDTH
      let labelX = Math.max(column, x + LABEL_GAP)
      let lineEnd = labelX - 8
      let elbow = labelX - 30
      // Anchor too close to the right edge (e.g. zoomed in): put the label on the dot's left instead.
      if (labelX + labelWidth > width - EDGE) {
        labelX = Math.max(EDGE, x - LABEL_GAP - labelWidth)
        lineEnd = labelX + labelWidth + 8
        elbow = lineEnd + 22
      }
      if (line) {
        line.setAttribute('points', `${x},${y} ${elbow},${labelY} ${lineEnd},${labelY}`)
        line.style.display = display
      }
      if (dot) {
        dot.setAttribute('cx', `${x}`)
        dot.setAttribute('cy', `${y}`)
        dot.style.display = display
      }
      if (label) {
        label.style.transform = `translate(${labelX}px, ${labelY}px) translateY(-50%)`
        label.style.display = display
      }
    }
  })

  return (
    <>
      {callouts.map((callout, index) => (
        <object3D
          key={callout.title}
          position={callout.position}
          ref={(node) => {
            markers.current[index] = node
          }}
        />
      ))}
      <Html
        fullscreen
        calculatePosition={(_, __, viewport) => [viewport.width / 2, viewport.height / 2]}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none', opacity, transition: 'opacity 200ms ease' }}
      >
        <svg width={size.width} height={size.height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {callouts.map((callout, index) => (
            <g key={callout.title}>
              <polyline
                ref={(node) => {
                  lines.current[index] = node
                }}
                fill="none"
                stroke={INK}
                strokeWidth={1}
              />
              <circle
                ref={(node) => {
                  dots.current[index] = node
                }}
                r={3.5}
                fill="#fff"
                stroke={INK}
                strokeWidth={1.5}
              />
            </g>
          ))}
        </svg>
        {callouts.map((callout, index) => (
          <div
            key={callout.title}
            ref={(node) => {
              labels.current[index] = node
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              maxWidth: LABEL_WIDTH,
              // When zoomed in the column is clamped over the model, so labels need their own backdrop.
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.86)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              color: '#1b1f1e',
              font: '600 14px/1.25 Inter, system-ui, sans-serif',
            }}
          >
            {callout.title}
            {callout.subtitle && <span style={{ display: 'block', fontWeight: 500, color: '#3d4342' }}>{callout.subtitle}</span>}
          </div>
        ))}
      </Html>
    </>
  )
}
