import { useSearchParams } from 'react-router-dom'

const MAX_COMPARE = 4

export function useSelection() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = (searchParams.get('selected') ?? '').split(',').filter(Boolean)

  function toggle(id: string) {
    let next: string[]
    if (selected.includes(id)) {
      next = selected.filter((x) => x !== id)
    } else if (selected.length >= MAX_COMPARE) {
      next = selected
    } else {
      next = [...selected, id]
    }
    setSearchParams(next.length ? { selected: next.join(',') } : {})
  }

  function clear() {
    setSearchParams({})
  }

  return { selected, toggle, clear, max: MAX_COMPARE }
}
