import * as THREE from 'three'

/**
 * Viewer-side looks for the Blender materials. glTF only carries base colour / roughness / metalness, so the
 * wet, slightly translucent feel of enamel and gum (clearcoat, sheen) is added here, matched by material name.
 */
interface Look {
  color: string
  roughness: number
  clearcoat?: number
  clearcoatRoughness?: number
  sheen?: number
  sheenColor?: string
}

const LOOKS: Record<string, Look> = {
  V2_Enamel: { color: '#f1e9da', roughness: 0.32, clearcoat: 0.45, clearcoatRoughness: 0.25, sheen: 0.3, sheenColor: '#fff6ea' },
  V2_CrownCeramic: { color: '#f4ede0', roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.15 },
  V2_DentureTooth: { color: '#f1e9da', roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.25 },
  V2_Zirconia: { color: '#f3eee6', roughness: 0.35, clearcoat: 0.25, clearcoatRoughness: 0.35 },
  // Cut faces: roots read lighter than the warm bone around them, as in a stained section.
  V3_Dentin_Cut: { color: '#f5eddf', roughness: 0.55 },
  V2_Gum: { color: '#e39d9b', roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.35, sheen: 0.6, sheenColor: '#ffd6d0' },
  V3_Gum_Cut: { color: '#d98683', roughness: 0.65 },
  V3_PDL: { color: '#a45e5a', roughness: 0.7 },
  V2_Bone: { color: '#e4d4b4', roughness: 0.8 },
  V3_Cortical_Cut: { color: '#eadcc0', roughness: 0.7 },
  V3_Cancellous_Cut: { color: '#dcc7a0', roughness: 0.95 },
}

/** Returns a physical material for known names, or the original material unchanged. */
export function dentalMaterial(source: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  const look = LOOKS[source.name]
  if (!look) return source
  const material = new THREE.MeshPhysicalMaterial({
    name: source.name,
    color: look.color,
    roughness: look.roughness,
    metalness: 0,
    clearcoat: look.clearcoat ?? 0,
    clearcoatRoughness: look.clearcoatRoughness ?? 0,
    sheen: look.sheen ?? 0,
    sheenColor: look.sheenColor ?? '#ffffff',
    side: source.side,
    transparent: source.transparent,
    opacity: source.opacity,
  })
  source.dispose()
  return material
}
