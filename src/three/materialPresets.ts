export interface MaterialPreset {
  color: string
  metalness: number
  roughness: number
  transparent?: boolean
  opacity?: number
}

export const materialPresets: Record<string, MaterialPreset> = {
  zirconia: { color: '#f5f2ee', metalness: 0.1, roughness: 0.15 },
  ceramic: { color: '#fbeee0', metalness: 0.0, roughness: 0.35 },
  metal: { color: '#b5b8bd', metalness: 0.9, roughness: 0.2 },
  titanium: { color: '#8f9296', metalness: 0.85, roughness: 0.3 },
  'plastic-clear': { color: '#dfeffd', metalness: 0, roughness: 0.1, transparent: true, opacity: 0.55 },
  composite: { color: '#e8d9c3', metalness: 0.05, roughness: 0.4 },
  default: { color: '#cccccc', metalness: 0.3, roughness: 0.4 },
}

export function getMaterialPreset(material: string): MaterialPreset {
  return materialPresets[material] ?? materialPresets.default
}
