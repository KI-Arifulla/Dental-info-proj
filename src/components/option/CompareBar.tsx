interface CompareBarProps {
  selectedNames: string[]
  max: number
  onView: () => void
  onCompare: () => void
  onClear: () => void
}

export function CompareBar({ selectedNames, max, onView, onCompare, onClear }: CompareBarProps) {
  if (selectedNames.length === 0) return null
  const single = selectedNames.length === 1
  return (
    <div className="compare-bar">
      <span className="compare-bar-names">
        {selectedNames.join(' · ')}
        <small>
          {single
            ? 'Select another option to compare'
            : `${selectedNames.length} of ${max} selected`}
        </small>
      </span>
      <div className="compare-bar-actions">
        <button type="button" className="btn-secondary" onClick={onClear}>
          Clear
        </button>
        {single ? (
          <button type="button" className="btn-primary" onClick={onView}>
            View option
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={onCompare}>
            Compare {selectedNames.length}
          </button>
        )}
      </div>
    </div>
  )
}
