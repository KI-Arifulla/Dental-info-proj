import type { TreatmentOption } from '../../data/types'
import { ModelViewer } from '../../three/ModelViewer'
import { PriceBadge } from '../detail/PriceBadge'

export function ComparePanel({ option }: { option: TreatmentOption }) {
  return (
    <div className="compare-panel">
      <ModelViewer {...option.model} autoRotate enableZoom={false} height={220} />
      <h3>{option.name}</h3>
      <PriceBadge priceRange={option.priceRange} />
    </div>
  )
}
