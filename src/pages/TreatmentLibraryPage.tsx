import { TreatmentGrid } from '../components/treatment/TreatmentGrid'
import { treatments } from '../data/treatments'
import '../styles/library.css'

export function TreatmentLibraryPage() {
  return (
    <main className="page library-page">
      <div className="library-content">
        <header className="library-intro">
          <span className="eyebrow">Treatment library</span>
          <h1 className="headline">Let&apos;s look at your options together.</h1>
          <p className="subhead">
            Choose a treatment. We&apos;ll compare what each one involves, how long it takes, and what it
            costs.
          </p>
        </header>
        <TreatmentGrid treatments={treatments} />
      </div>
    </main>
  )
}
