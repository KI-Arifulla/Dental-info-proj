interface CompareBarProps {
  count: number
  max: number
  onCompare: () => void
  onClear: () => void
}

export function CompareBar({ count, max, onCompare, onClear }: CompareBarProps) {
  if (count === 0) return null
  return (
    <div className="compare-bar">
      <span>
        {count} selected {count >= max ? `(max ${max})` : ''}
      </span>
      <div className="compare-bar-actions">
        <button className="btn-ghost" onClick={onClear}>
          Clear
        </button>
        <button className="btn-primary" disabled={count < 2} onClick={onCompare}>
          Compare ({count})
        </button>
      </div>
    </div>
  )
}
