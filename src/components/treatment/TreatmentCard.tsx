import { Link } from 'react-router-dom'
import type { Treatment } from '../../data/types'

export function TreatmentCard({ treatment }: { treatment: Treatment }) {
  return (
    <Link to={`/treatment/${treatment.id}`} className="card treatment-card">
      <div className="treatment-icon">{treatment.icon}</div>
      <h3>{treatment.name}</h3>
      <p>{treatment.description}</p>
      <span className="option-count">{treatment.options.length} options</span>
    </Link>
  )
}
