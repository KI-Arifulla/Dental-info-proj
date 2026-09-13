import type { TreatmentOption } from '../../data/types'
import { PriceBadge } from './PriceBadge'

export function SpecSheet({ option }: { option: TreatmentOption }) {
  return (
    <div className="spec-sheet">
      <h1>{option.name}</h1>
      <PriceBadge priceRange={option.priceRange} />
      <p className="long-desc">{option.longDescription}</p>

      <div className="pros-cons">
        <div>
          <h4>Pros</h4>
          <ul className="pros">
            {option.pros.map((p) => (
              <li key={p}>✓ {p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Cons</h4>
          <ul className="cons">
            {option.cons.map((c) => (
              <li key={c}>✗ {c}</li>
            ))}
          </ul>
        </div>
      </div>

      <h4>Specs</h4>
      <table className="spec-table">
        <tbody>
          {option.specs.map((s) => (
            <tr key={s.label}>
              <td>{s.label}</td>
              <td>{s.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
