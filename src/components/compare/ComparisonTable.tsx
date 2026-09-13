import type { TreatmentOption } from '../../data/types'
import { formatPrice } from '../../utils/formatPrice'

export function ComparisonTable({ options }: { options: TreatmentOption[] }) {
  const specLabels = Array.from(new Set(options.flatMap((o) => o.specs.map((s) => s.label))))

  function specValue(option: TreatmentOption, label: string) {
    return option.specs.find((s) => s.label === label)?.value ?? '—'
  }

  return (
    <table className="comparison-table">
      <thead>
        <tr>
          <th></th>
          {options.map((o) => (
            <th key={o.id}>{o.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Price</td>
          {options.map((o) => (
            <td key={o.id}>{formatPrice(o.priceRange)}</td>
          ))}
        </tr>
        {specLabels.map((label) => (
          <tr key={label}>
            <td>{label}</td>
            {options.map((o) => (
              <td key={o.id}>{specValue(o, label)}</td>
            ))}
          </tr>
        ))}
        <tr>
          <td>Pros</td>
          {options.map((o) => (
            <td key={o.id}>
              <ul className="pros">
                {o.pros.map((p) => (
                  <li key={p}>✓ {p}</li>
                ))}
              </ul>
            </td>
          ))}
        </tr>
        <tr>
          <td>Cons</td>
          {options.map((o) => (
            <td key={o.id}>
              <ul className="cons">
                {o.cons.map((c) => (
                  <li key={c}>✗ {c}</li>
                ))}
              </ul>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}
