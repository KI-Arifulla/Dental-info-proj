import { useNavigate, useParams } from 'react-router-dom'
import { getTreatment } from '../data/treatments'
import { OptionList } from '../components/option/OptionList'
import { CompareBar } from '../components/option/CompareBar'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { useSelection } from '../utils/useSelection'

export function TreatmentOptionsPage() {
  const { treatmentId = '' } = useParams()
  const navigate = useNavigate()
  const treatment = getTreatment(treatmentId)
  const { selected, toggle, clear, max } = useSelection()

  if (!treatment) {
    return (
      <div className="page">
        <p>Treatment not found.</p>
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }]} />
      </div>
    )
  }

  function handleCompare() {
    navigate(`/treatment/${treatmentId}/compare?selected=${selected.join(',')}`)
  }

  return (
    <div className="page">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: treatment.name }]} />
      <h1>
        {treatment.icon} {treatment.name}
      </h1>
      <p className="page-subtitle">{treatment.description}</p>
      <OptionList
        treatmentId={treatmentId}
        options={treatment.options}
        selected={selected}
        onToggleSelect={toggle}
      />
      <CompareBar count={selected.length} max={max} onCompare={handleCompare} onClear={clear} />
    </div>
  )
}
