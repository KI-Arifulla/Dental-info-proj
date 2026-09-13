import { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ModelConfig } from '../data/types'
import { getMaterialPreset } from './materialPresets'
import { DentalGeometryMesh } from './toothGeometries'

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

function Primitive({ geometry, material, scale }: ModelConfig) {
  const matProps = getMaterialPreset(material)

  if (
    geometry === 'crown' ||
    geometry === 'implant' ||
    geometry === 'aligner-tray' ||
    geometry === 'veneer' ||
    geometry === 'bridge'
  ) {
    return <DentalGeometryMesh geometry={geometry} matProps={matProps} scale={scale} />
  }

  return (
    <mesh scale={scale}>
      {geometry === 'torus' && <torusGeometry args={[1, 0.4, 32, 100]} />}
      {geometry === 'cylinder' && <cylinderGeometry args={[0.4, 0.4, 2, 32]} />}
      {geometry === 'capsule' && <capsuleGeometry args={[0.6, 1.2, 4, 16]} />}
      {geometry === 'box' && <boxGeometry args={[1.2, 1.2, 1.2]} />}
      {geometry === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
      <meshStandardMaterial {...matProps} />
    </mesh>
  )
}

export function PlaceholderModel(config: ModelConfig) {
  if (config.modelUrl) {
    return (
      <Suspense fallback={<Primitive {...config} />}>
        <GLTFModel url={config.modelUrl} />
      </Suspense>
    )
  }
  return <Primitive {...config} />
}
