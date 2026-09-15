import type { KeyboardEvent } from 'react'
import type { TreatmentOption } from '../../data/types'
import { getEffectivePrice } from '../../utils/pricing'
import { PriceBadge } from '../detail/PriceBadge'

interface OptionCardProps {
  treatmentId: string
  option: TreatmentOption
  selected: boolean
  selectionFull: boolean
  onToggleSelect: (id: string) => void
}

export function OptionCard({
  treatmentId,
  option,
  selected,
  selectionFull,
  onToggleSelect,
}: OptionCardProps) {
  const price = getEffectivePrice(treatmentId, option.id, option.price)
  const disabled = !selected && selectionFull

  function toggle() {
    if (!disabled) onToggleSelect(option.id)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle()
    }
  }

  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={0}
      className={`card option-card${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
      onClick={toggle}
      onKeyDown={handleKeyDown}
    >
      <span className="option-selection-indicator" aria-hidden="true">
        {selected ? '✓' : ''}
      </span>
      {option.badge && <span className="eyebrow option-badge">{option.badge}</span>}
      <h2>{option.name}</h2>
      <PriceBadge price={price} />
      <p className="option-description">{option.shortDescription}</p>
      <div className="option-pros-cons">
        <ul className="pros">
          {option.pros.map((pro) => (
            <li key={pro}>{pro}</li>
          ))}
        </ul>
        <ul className="cons">
          {option.cons.map((con) => (
            <li key={con}>{con}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
