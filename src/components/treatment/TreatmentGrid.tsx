import type { Treatment } from '../../data/types'
import { TreatmentCard } from './TreatmentCard'

export function TreatmentGrid({ treatments }: { treatments: Treatment[] }) {
  return (
    <div className="grid treatment-grid">
      {treatments.map((t) => (
        <TreatmentCard key={t.id} treatment={t} />
      ))}
    </div>
  )
}
