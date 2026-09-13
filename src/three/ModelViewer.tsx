import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import type { ModelConfig } from '../data/types'
import { PlaceholderModel } from './PlaceholderModel'

interface ModelViewerProps extends ModelConfig {
  autoRotate?: boolean
  enableZoom?: boolean
  enablePan?: boolean
  height?: number | string
}

export function ModelViewer({
  autoRotate = false,
  enableZoom = true,
  enablePan = false,
  height = 320,
  ...config
}: ModelViewerProps) {
  return (
    <div style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden', background: '#14161c' }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 3]} intensity={1} />
        <PlaceholderModel {...config} />
        <Environment preset="studio" />
        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={2.2}
          enableZoom={enableZoom}
          enablePan={enablePan}
        />
      </Canvas>
    </div>
  )
}
