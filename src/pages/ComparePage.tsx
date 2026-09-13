import { useParams } from 'react-router-dom'
import { getOptions, getTreatment } from '../data/treatments'
import { ComparePanel } from '../components/compare/ComparePanel'
import { ComparisonTable } from '../components/compare/ComparisonTable'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { useSelection } from '../utils/useSelection'

export function ComparePage() {
  const { treatmentId = '' } = useParams()
  const treatment = getTreatment(treatmentId)
  const { selected } = useSelection()
  const options = getOptions(treatmentId, selected)

  if (!treatment || options.length === 0) {
    return (
      <div className="page">
        <p>Nothing to compare. Go back and select at least two options.</p>
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: treatment?.name ?? '' , to: `/treatment/${treatmentId}` }]} />
      </div>
    )
  }

  return (
    <div className="page">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: treatment.name, to: `/treatment/${treatmentId}` },
          { label: 'Compare' },
        ]}
      />
      <h1>Compare {treatment.name}</h1>
      <div className="compare-panels">
        {options.map((o) => (
          <ComparePanel key={o.id} option={o} />
        ))}
      </div>
      <ComparisonTable options={options} />
    </div>
  )
}
