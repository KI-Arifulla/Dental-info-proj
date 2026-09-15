import { Link } from 'react-router-dom'
import type { Treatment } from '../../data/types'

export function TreatmentCard({ treatment }: { treatment: Treatment }) {
  return (
    <Link to={`/treatment/${treatment.id}`} className="card treatment-card">
      <div className="treatment-icon">{treatment.icon}</div>
      <h3>{treatment.name}</h3>
      <p>{treatment.description}</p>
      <ul className="treatment-option-list">
        {treatment.options.map((option) => (
          <li key={option.id}>{option.name}</li>
        ))}
      </ul>
      <span className="btn-link treatment-explore-link" aria-hidden="true">
        Explore
      </span>
    </Link>
  )
}
