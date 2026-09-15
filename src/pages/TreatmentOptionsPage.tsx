import { Link, useNavigate, useParams } from 'react-router-dom'
import { getTreatment } from '../data/treatments'
import { OptionList } from '../components/option/OptionList'
import { CompareBar } from '../components/option/CompareBar'
import { useSelection } from '../utils/useSelection'
import { CLINIC_NAME } from '../config/appConfig'
import '../styles/options.css'

export function TreatmentOptionsPage() {
  const { treatmentId = '' } = useParams()
  const navigate = useNavigate()
  const treatment = getTreatment(treatmentId)
  const { selected, toggle, clear, max } = useSelection(
    treatment?.options.map((option) => option.id),
  )

  if (!treatment) {
    return (
      <div className="page">
        <p>Treatment not found.</p>
      </div>
    )
  }

  const selectedParam = new URLSearchParams({ selected: selected.join(',') })

  function handleView() {
    navigate(`/treatment/${treatmentId}/option/${selected[0]}?${selectedParam}`)
  }

  function handleCompare() {
    navigate(`/treatment/${treatmentId}/compare?${selectedParam}`)
  }

  return (
    <main className="page options-page">
      <header className="options-header">
        <Link to="/treatments" className="back-link">
          ← All treatments
        </Link>
        <p className="options-context">{CLINIC_NAME} · {treatment.name}</p>
        <span className="eyebrow">Tap to select · pick up to three to compare</span>
        <h1 className="headline">{treatment.name}</h1>
        <p className="subhead">{treatment.description}</p>
      </header>
      <OptionList
        treatmentId={treatmentId}
        options={treatment.options}
        selected={selected}
        max={max}
        onToggleSelect={toggle}
      />
      <CompareBar
        selectedNames={treatment.options
          .filter((option) => selected.includes(option.id))
          .map((option) => option.name)}
        max={max}
        onView={handleView}
        onCompare={handleCompare}
        onClear={clear}
      />
    </main>
  )
}
