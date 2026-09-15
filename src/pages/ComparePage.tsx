import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getOptions, getTreatment } from '../data/treatments'
import { ComparePanel } from '../components/compare/ComparePanel'
import '../styles/compare.css'

export function ComparePage() {
  const { treatmentId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const treatment = getTreatment(treatmentId)
  const requestedIds = Array.from(
    new Set((searchParams.get('selected') ?? '').split(',').filter(Boolean)),
  )
  const options = getOptions(treatmentId, requestedIds).slice(0, 3)
  const selected = options.map((option) => option.id)

  if (!treatment || options.length === 0) {
    return (
      <main className="page empty-state">
        <h1 className="headline">Nothing selected yet.</h1>
        <p className="subhead">Choose at least one option to open the side-by-side view.</p>
        <Link className="btn-primary" to={`/treatment/${treatmentId}`}>
          Back to options
        </Link>
      </main>
    )
  }

  return (
    <main className="page compare-page">
      <header className="compare-header">
        <div>
          <span className="eyebrow">{treatment.name}</span>
          <h1 className="headline">Side by side</h1>
          <p className="subhead">{options.map((option) => option.name).join(' · ')}</p>
        </div>
        <Link className="btn-secondary" to={`/treatment/${treatmentId}`}>
          Back to options
        </Link>
      </header>
      <div className="compare-panels">
        {options.map((o) => (
          <ComparePanel key={o.id} treatmentId={treatmentId} option={o} selectedIds={selected} />
        ))}
      </div>
    </main>
  )
}
