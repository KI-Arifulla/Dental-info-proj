import { Link } from 'react-router-dom'
import type { TreatmentOption } from '../../data/types'
import { ModelViewer } from '../../three/ModelViewer'
import { PriceBadge } from '../detail/PriceBadge'

interface OptionCardProps {
  treatmentId: string
  option: TreatmentOption
  selected: boolean
  onToggleSelect: (id: string) => void
}

export function OptionCard({ treatmentId, option, selected, onToggleSelect }: OptionCardProps) {
  return (
    <div className={`card option-card${selected ? ' selected' : ''}`}>
      <label className="select-checkbox" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(option.id)}
        />
      </label>
      <Link to={`/treatment/${treatmentId}/option/${option.id}`} className="option-card-link">
        <ModelViewer {...option.model} autoRotate enableZoom={false} height={160} />
        <h3>{option.name}</h3>
        <p>{option.shortDescription}</p>
        <PriceBadge priceRange={option.priceRange} />
      </Link>
    </div>
  )
}
