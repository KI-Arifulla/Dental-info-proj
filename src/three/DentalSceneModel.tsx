import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Center, useGLTF } from '@react-three/drei'
import type { DentalScene, DentalSceneFile } from '../data/types'
import { dentalMaterial } from './dentalMaterials'
import { SectionCallouts, type Callout } from './SectionCallouts'

const SCENE_URLS: Record<DentalSceneFile, string> = {
  implants: '/models/implants.glb',
  rootcanal: '/models/rootcanal.glb',
  ortho: '/models/ortho.glb',
}

export interface DentalViewOptions {
  /** Index into scene.stages (existing condition first). */
  stageIndex?: number
  /** 0-1: front gum peels away first, then front bone, then the treated tooth turns see-through. */
  reveal?: number
}

// Scene units: GLB nodes carry Blender's x100 export scale, so 1 mm = 0.1 units.
const MM = 0.1
// Blender -Y (cheek side) becomes glTF +Z, i.e. toward the camera.
const PEEL_OUT = 14 * MM
const PEEL_LIFT = 4 * MM
const MIN_TOOTH_OPACITY = 0.15
// Blender's blend mode does not survive glTF export reliably, so see-through parts are set here.
interface TranslucentLook {
  opacity: number
  color?: string
  glow?: string
  roughness?: number
  envIntensity?: number
}
const TRANSLUCENT_NODES: Record<string, TranslucentLook> = {
  // Studio reflections made the glossy shell read as enamel; a matte, tinted, dim-reflection shell reads as plastic.
  ORT_Aligner_Tray: { opacity: 0.32, color: '#78b4e8', glow: '#08213a', roughness: 0.25, envIntensity: 0.45 },
  RCT_Abscess_Large: { opacity: 0.85 },
  RCT_Abscess_Small: { opacity: 0.85 },
}

// Callout anchors in Blender millimetres (x, y, z); y = -0.4 is the section face.
const FOCUS_ANCHORS: Record<DentalSceneFile, [number, number, number]> = {
  implants: [2.15, -2.0, -3.6],
  rootcanal: [2.15, -3.0, -3.0],
  ortho: [2.15, -5.5, 5.0],
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const easeInOut = (t: number) => t * t * (3 - 2 * t)
const toScene = ([x, y, z]: [number, number, number]) => [x * MM, z * MM, -y * MM] as const

function revealPhases(reveal: number) {
  return {
    gum: clamp01(reveal / 0.4),
    bone: clamp01((reveal - 0.35) / 0.35),
    tooth: clamp01((reveal - 0.7) / 0.3),
  }
}

/** Which reveal phase peels a front piece away, or null for pieces that stay put. */
function peelPhase(name: string, phases: ReturnType<typeof revealPhases>) {
  if (!name.endsWith('_Front')) return null
  return name.startsWith('SEC_Gum') ? phases.gum : phases.bone
}

function sceneNodes(model: THREE.Object3D) {
  return model.getObjectByName('SCENE_ROOT')?.children ?? model.children
}

function forEachMaterial(node: THREE.Object3D, fn: (material: THREE.MeshStandardMaterial) => void) {
  node.traverse((child) => {
    if (child instanceof THREE.Mesh) fn(child.material as THREE.MeshStandardMaterial)
  })
}

export function DentalSceneModel({ scene, stageIndex = 0, reveal = 0 }: DentalViewOptions & { scene: DentalScene }) {
  const { scene: gltfScene } = useGLTF(SCENE_URLS[scene.file])

  // Clone per viewer so visibility, opacity and offsets never leak into the shared GLTF cache.
  const model = useMemo(() => {
    const root = gltfScene.clone(true)
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.material = dentalMaterial((child.material as THREE.MeshStandardMaterial).clone())
    })
    for (const node of sceneNodes(root)) {
      node.userData.basePosition = node.position.clone()
      // Match on the scene node, not the mesh: GLTFLoader may rename meshes (suffixes, stripped dots).
      const translucent = TRANSLUCENT_NODES[node.name]
      if (!translucent) continue
      forEachMaterial(node, (material) => {
        material.transparent = true
        material.opacity = translucent.opacity
        if (translucent.color) material.color.set(translucent.color)
        if (translucent.glow) material.emissive.set(translucent.glow)
        if (translucent.roughness !== undefined) material.roughness = translucent.roughness
        if (translucent.envIntensity !== undefined) material.envMapIntensity = translucent.envIntensity
        // Voxel-remeshed shells can come out with inward normals; render both faces.
        material.side = THREE.DoubleSide
      })
    }
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const material = child.material as THREE.MeshStandardMaterial
      material.userData.baseOpacity = material.opacity
      material.userData.baseTransparent = material.transparent
    })
    return root
  }, [gltfScene])

  useEffect(
    () => () => {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) (child.material as THREE.Material).dispose()
      })
    },
    [model],
  )

  const phases = revealPhases(reveal)

  useEffect(() => {
    const stage = scene.stages[Math.min(Math.max(stageIndex, 0), scene.stages.length - 1)]
    const visible = new Set([...scene.baseNodes, ...stage.nodes])
    const fading = new Set(scene.revealNodes)
    const phases = revealPhases(reveal)

    for (const node of sceneNodes(model)) {
      const peel = peelPhase(node.name, phases)
      node.visible = visible.has(node.name) && (peel === null || peel < 1)

      let factor = fading.has(node.name) ? 1 - (1 - MIN_TOOTH_OPACITY) * phases.tooth : 1
      if (peel !== null) {
        const t = easeInOut(peel)
        const base = node.userData.basePosition as THREE.Vector3
        node.position.set(base.x, base.y + PEEL_LIFT * t, base.z + PEEL_OUT * t)
        factor = 1 - t
      }
      forEachMaterial(node, (material) => {
        const opacity = material.userData.baseOpacity * factor
        const transparent = material.userData.baseTransparent || opacity < 1
        if (material.transparent !== transparent) material.needsUpdate = true
        material.transparent = transparent
        material.opacity = opacity
        material.depthWrite = !transparent
      })
    }
  }, [model, scene, stageIndex, reveal])

  // Callouts appear once the front bone has fully peeled away and the section is open.
  const calloutOpacity = clamp01((phases.bone - 0.85) / 0.15)
  const callouts: Callout[] = [
    { title: 'Gum', subtitle: '(Gingiva)', position: toScene([14.6, -0.4, -1.6]) },
    { title: 'Jawbone', subtitle: '(Cross-section)', position: toScene([6.3, -0.4, -8.0]) },
  ]
  if (scene.focusLabel) callouts.splice(1, 0, { ...scene.focusLabel, position: toScene(FOCUS_ANCHORS[scene.file]) })

  return (
    <Center rotation={[0.35, 0, 0]} scale={0.72}>
      <primitive object={model} />
      {calloutOpacity > 0 && <SectionCallouts callouts={callouts} opacity={calloutOpacity} bounds={model} />}
    </Center>
  )
}
