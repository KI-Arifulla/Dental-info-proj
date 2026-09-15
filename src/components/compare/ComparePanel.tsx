import { Link } from 'react-router-dom'
import type { TreatmentOption } from '../../data/types'
import { getEffectivePrice } from '../../utils/pricing'
import { PriceBadge } from '../detail/PriceBadge'
import { ComparisonTable } from './ComparisonTable'
import { CrossSection } from './CrossSection'

interface ComparePanelProps {
  treatmentId: string
  option: TreatmentOption
  selectedIds: string[]
}

export function ComparePanel({ treatmentId, option, selectedIds }: ComparePanelProps) {
  const price = getEffectivePrice(treatmentId, option.id, option.price)
  const search = new URLSearchParams({ selected: selectedIds.join(',') })
  const detailUrl = `/treatment/${treatmentId}/option/${option.id}?${search}`

  return (
    <div className="compare-panel">
      <Link className="compare-cross-section" to={detailUrl} aria-label={`Open ${option.name} in 3D`}>
        <CrossSection option={option} />
        <span className="compare-cross-section-hint">Tap to open 3D model</span>
      </Link>
      <div className="compare-panel-heading">
        <h2>{option.name}</h2>
        <PriceBadge price={price} />
      </div>
      <ComparisonTable option={option} />
      <Link
        className="btn-secondary compare-open-button"
        to={detailUrl}
      >
        Open 3D view
      </Link>
    </div>
  )
}
