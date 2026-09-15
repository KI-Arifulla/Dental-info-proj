import { Component, forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { ComponentRef, ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { DentalScene, ModelConfig } from '../data/types'
import { PlaceholderModel } from './PlaceholderModel'
import type { DentalViewOptions } from './DentalSceneModel'

interface ModelViewerProps extends ModelConfig, DentalViewOptions {
  scene?: DentalScene
  autoRotate?: boolean
  enableZoom?: boolean
  enablePan?: boolean
  height?: number | string
}

export interface ModelViewerHandle {
  rotate: () => void
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
}

interface CameraRigHandle {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
}

interface CameraRigProps {
  autoRotate: boolean
  enableZoom: boolean
  enablePan: boolean
}

const CameraRig = forwardRef<CameraRigHandle, CameraRigProps>(function CameraRig(
  { autoRotate, enableZoom, enablePan },
  ref,
) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera } = useThree()

  function zoomBy(factor: number) {
    const controls = controlsRef.current
    if (!controls) return
    const distance = camera.position.distanceTo(controls.target)
    const nextDistance = Math.min(8, Math.max(1.8, distance * factor))
    camera.position
      .sub(controls.target)
      .normalize()
      .multiplyScalar(nextDistance)
      .add(controls.target)
    camera.updateProjectionMatrix()
    controls.update()
  }

  useImperativeHandle(ref, () => ({
    zoomIn: () => zoomBy(0.8),
    zoomOut: () => zoomBy(1.25),
    reset: () => controlsRef.current?.reset(),
  }))

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={autoRotate}
      autoRotateSpeed={2.2}
      enableZoom={enableZoom}
      enablePan={enablePan}
      minDistance={1.8}
      maxDistance={8}
    />
  )
})

class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return <div className="model-error">The 3D model could not be loaded. Please refresh to try again.</div>
    }
    return this.props.children
  }
}

export const ModelViewer = forwardRef<ModelViewerHandle, ModelViewerProps>(function ModelViewer(
  {
    autoRotate = false,
    enableZoom = true,
    enablePan = false,
    height = 320,
    ...config
  },
  ref,
) {
  const [isRotating, setIsRotating] = useState(autoRotate)
  const cameraRigRef = useRef<CameraRigHandle>(null)

  useImperativeHandle(ref, () => ({
    rotate: () => setIsRotating((current) => !current),
    zoomIn: () => cameraRigRef.current?.zoomIn(),
    zoomOut: () => cameraRigRef.current?.zoomOut(),
    reset: () => {
      setIsRotating(false)
      cameraRigRef.current?.reset()
    },
  }))

  return (
    <div style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden', background: '#f7f8f8' }}>
      <ModelErrorBoundary key={config.scene?.file ?? config.geometry}>
        <Canvas
          camera={{ position: [0, 0, 4], fov: 45 }}
          gl={{ toneMappingExposure: 0.85 }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[2, 4, 4]} intensity={0.75} />
          <directionalLight position={[-3, 1, -2]} intensity={0.25} />
          <PlaceholderModel {...config} />
          <Environment preset="studio" environmentIntensity={0.55} />
          <CameraRig
            ref={cameraRigRef}
            autoRotate={isRotating}
            enableZoom={enableZoom}
            enablePan={enablePan}
          />
        </Canvas>
      </ModelErrorBoundary>
    </div>
  )
})
