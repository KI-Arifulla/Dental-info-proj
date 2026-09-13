import { treatments } from '../data/treatments'
import { TreatmentGrid } from '../components/treatment/TreatmentGrid'

export function DashboardPage() {
  return (
    <div className="page">
      <h1>Choose a Treatment</h1>
      <p className="page-subtitle">Explore options, compare materials, and see an interactive 3D preview.</p>
      <TreatmentGrid treatments={treatments} />
    </div>
  )
}
