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

export interface Faq {
  question: string
  answer: string
}

/** Patient-facing decision facts. Ranges, never guarantees: outcomes depend on the individual case. */
export interface OptionDecisionFacts {
  longevity: { min: number; max: number; unit: 'years' | 'months'; note?: string }
  visits: string
  duration: string
  comfort: string
  appearance: string
  maintenance: string
  ifItFails: string
  /** Extra procedures, costs or habits the patient should plan for with this option. */
  considerations: string[]
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

export interface OptionGuide {
  facts: OptionDecisionFacts
  faqs: Faq[]
}

export interface TreatmentGuide {
  /** Plain-language summary of the underlying problem. */
  problem: string
  /** What may happen without treatment. Possibilities, not predictions. */
  ifUntreated: { label: string; description: string }[]
  warningSigns: string[]
  aftercare: string[]
  faqs: Faq[]
}

export interface Treatment {
  id: string
  name: string
  description: string
  icon: string
  options: TreatmentOption[]
}
