export interface OptionSpec {
  label: string
  value: string
}

export type Geometry =
  | 'torus'
  | 'cylinder'
  | 'capsule'
  | 'box'
  | 'sphere'
  | 'crown'
  | 'implant'
  | 'aligner-tray'
  | 'veneer'
  | 'bridge'

export type DentalSceneFile = 'implants' | 'rootcanal' | 'ortho'

export interface DentalSceneStage {
  id: string
  label: string
  description: string
  /** GLB node names shown at this stage, on top of the scene's baseNodes. */
  nodes: string[]
}

export interface DentalScene {
  file: DentalSceneFile
  /** Always-visible jaw and neighbouring teeth. */
  baseNodes: string[]
  /** Ordered from the existing condition to the finished treatment. */
  stages: DentalSceneStage[]
  /** Nodes that turn see-through at the end of the reveal slider so internal work is visible. */
  revealNodes: string[]
  /** Callout for the treated tooth / implant, shown once the cross-section is fully open. */
  focusLabel?: { title: string; subtitle?: string }
}

export interface ModelConfig {
  geometry: Geometry
  material: string
  scale?: [number, number, number]
  modelUrl?: string
}

export interface TreatmentOption {
  id: string
  name: string
  shortDescription: string
  longDescription: string
  pros: string[]
  cons: string[]
  price: number
  currency: string
  badge?: string
  specs: OptionSpec[]
  model: ModelConfig
  modelLabel?: string
}

export interface Treatment {
  id: string
  name: string
  description: string
  icon: string
  options: TreatmentOption[]
}
