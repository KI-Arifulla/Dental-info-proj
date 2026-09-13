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
