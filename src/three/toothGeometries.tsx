import { useMemo } from 'react'
import * as THREE from 'three'
import type { MaterialPreset } from './materialPresets'

// Lathe profile for a single molar-like crown, rotated around the y-axis.
// Points run base -> bulge -> cusp so the silhouette reads as a tooth, not a primitive.
const CROWN_PROFILE = [
  new THREE.Vector2(0.0, 0.0),
  new THREE.Vector2(0.5, 0.0),
  new THREE.Vector2(0.56, 0.12),
  new THREE.Vector2(0.6, 0.32),
  new THREE.Vector2(0.54, 0.56),
  new THREE.Vector2(0.36, 0.76),
  new THREE.Vector2(0.16, 0.92),
  new THREE.Vector2(0.0, 1.0),
]

function CrownMesh({ matProps, scale }: { matProps: MaterialPreset; scale?: [number, number, number] }) {
  const geometry = useMemo(() => new THREE.LatheGeometry(CROWN_PROFILE, 48), [])
  return (
    <mesh geometry={geometry} scale={scale} castShadow receiveShadow>
      <meshStandardMaterial {...matProps} />
    </mesh>
  )
}

function ImplantMesh({ matProps, scale }: { matProps: MaterialPreset; scale?: [number, number, number] }) {
  const threadCount = 14
  const threads = useMemo(
    () => Array.from({ length: threadCount }, (_, i) => -0.9 + (i * 1.5) / threadCount),
    [],
  )
  return (
    <group scale={scale}>
      {/* screw post */}
      <mesh position={[0, -0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.22, 1.5, 24]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* thread ridges */}
      {threads.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <torusGeometry args={[0.2 - i * 0.002, 0.02, 8, 24]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      ))}
      {/* abutment */}
      <mesh position={[0, 0.68, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.35, 16]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* crown cap */}
      <mesh position={[0, 0.9, 0]} scale={[0.55, 0.5, 0.55]} castShadow receiveShadow>
        <primitive object={new THREE.LatheGeometry(CROWN_PROFILE, 32)} attach="geometry" />
        <meshStandardMaterial color="#f5f2ee" metalness={0.1} roughness={0.15} />
      </mesh>
    </group>
  )
}

function AlignerTrayMesh({ matProps, scale }: { matProps: MaterialPreset; scale?: [number, number, number] }) {
  const geometry = useMemo(() => new THREE.TorusGeometry(0.9, 0.32, 16, 48, Math.PI * 1.5), [])
  return (
    <mesh
      geometry={geometry}
      rotation={[Math.PI / 2, 0, Math.PI * 0.75]}
      scale={scale ? [scale[0] * 1, scale[1] * 0.55, scale[2] * 1] : [1, 0.55, 1]}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        {...matProps}
        transmission={0.85}
        thickness={0.4}
        clearcoat={1}
        ior={1.4}
      />
    </mesh>
  )
}

function VeneerShellMesh({ matProps, scale }: { matProps: MaterialPreset; scale?: [number, number, number] }) {
  const geometry = useMemo(
    () => new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 0.6, 0, Math.PI * 0.6),
    [],
  )
  return (
    <mesh
      geometry={geometry}
      rotation={[0, -Math.PI * 0.3, 0]}
      scale={scale ? [scale[0], scale[1] * 1.3, scale[2] * 0.18] : [1, 1.3, 0.18]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial {...matProps} side={THREE.DoubleSide} />
    </mesh>
  )
}

function BridgeMesh({ matProps, scale }: { matProps: MaterialPreset; scale?: [number, number, number] }) {
  const geometry = useMemo(() => new THREE.LatheGeometry(CROWN_PROFILE, 32), [])
  const positions: [number, number, number][] = [
    [-0.85, 0, 0],
    [0, 0.08, 0],
    [0.85, 0, 0],
  ]
  return (
    <group scale={scale}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos} scale={[0.7, i === 1 ? 0.85 : 0.7, 0.7]} castShadow receiveShadow>
          <primitive object={geometry} attach="geometry" />
          <meshStandardMaterial {...matProps} />
        </mesh>
      ))}
      {/* connecting bar so the pontic reads as one fixed span */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.1, 0.1, 0.35]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
    </group>
  )
}

export function DentalGeometryMesh({
  geometry,
  matProps,
  scale,
}: {
  geometry: 'crown' | 'implant' | 'aligner-tray' | 'veneer' | 'bridge'
  matProps: MaterialPreset
  scale?: [number, number, number]
}) {
  switch (geometry) {
    case 'crown':
      return <CrownMesh matProps={matProps} scale={scale} />
    case 'implant':
      return <ImplantMesh matProps={matProps} scale={scale} />
    case 'aligner-tray':
      return <AlignerTrayMesh matProps={matProps} scale={scale} />
    case 'veneer':
      return <VeneerShellMesh matProps={matProps} scale={scale} />
    case 'bridge':
      return <BridgeMesh matProps={matProps} scale={scale} />
  }
}
