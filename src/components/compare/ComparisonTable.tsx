import type { TreatmentOption } from '../../data/types'

export function ComparisonTable({ option }: { option: TreatmentOption }) {
  return (
    <div className="comparison-details">
      <table className="spec-table">
        <tbody>
          {option.specs.map((spec) => (
            <tr key={spec.label}>
              <td>{spec.label}</td>
              <td>{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="compare-list-block">
        <h3>Benefits</h3>
        <ul className="pros">
          {option.pros.map((pro) => (
            <li key={pro}>{pro}</li>
          ))}
        </ul>
      </div>
      <div className="compare-list-block">
        <h3>Considerations</h3>
        <ul className="cons">
          {option.cons.map((con) => (
            <li key={con}>{con}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
