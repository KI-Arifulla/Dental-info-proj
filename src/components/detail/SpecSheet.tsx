import type { TreatmentOption } from '../../data/types'
import { PriceBadge } from './PriceBadge'

export function SpecSheet({ option, price }: { option: TreatmentOption; price: number }) {
  return (
    <div className="spec-sheet">
      {option.badge && <span className="eyebrow detail-badge">{option.badge}</span>}
      <h1 className="headline">{option.name}</h1>
      <p className="long-desc">{option.longDescription}</p>
      <PriceBadge price={price} />

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

      <div className="detail-pros">
        <h4>Benefits</h4>
        <ul className="pros">
          {option.pros.map((pro) => (
            <li key={pro}>{pro}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
