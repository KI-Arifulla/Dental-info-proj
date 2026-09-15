import type { TreatmentOption } from '../../data/types'
import { OptionCard } from './OptionCard'

interface OptionListProps {
  treatmentId: string
  options: TreatmentOption[]
  selected: string[]
  max: number
  onToggleSelect: (id: string) => void
}

export function OptionList({ treatmentId, options, selected, max, onToggleSelect }: OptionListProps) {
  return (
    <div className="grid">
      {options.map((o) => (
        <OptionCard
          key={o.id}
          treatmentId={treatmentId}
          option={o}
          selected={selected.includes(o.id)}
          selectionFull={selected.length >= max}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  )
}
