import type { TreatmentOption } from '../../data/types'
import { OptionCard } from './OptionCard'

interface OptionListProps {
  treatmentId: string
  options: TreatmentOption[]
  selected: string[]
  onToggleSelect: (id: string) => void
}

export function OptionList({ treatmentId, options, selected, onToggleSelect }: OptionListProps) {
  return (
    <div className="grid">
      {options.map((o) => (
        <OptionCard
          key={o.id}
          treatmentId={treatmentId}
          option={o}
          selected={selected.includes(o.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  )
}
