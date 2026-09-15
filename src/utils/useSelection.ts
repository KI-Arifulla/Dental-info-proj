import { useSearchParams } from 'react-router-dom'

const MAX_COMPARE = 3

export function useSelection(validIds?: string[]) {
  const [searchParams, setSearchParams] = useSearchParams()
  const allowedIds = validIds ? new Set(validIds) : null
  const selected = Array.from(
    new Set((searchParams.get('selected') ?? '').split(',').filter(Boolean)),
  )
    .filter((id) => !allowedIds || allowedIds.has(id))
    .slice(0, MAX_COMPARE)

  function toggle(id: string) {
    let next: string[]
    if (selected.includes(id)) {
      next = selected.filter((x) => x !== id)
    } else if (selected.length >= MAX_COMPARE) {
      next = selected
    } else {
      next = [...selected, id]
    }
    setSearchParams((current) => {
      const params = new URLSearchParams(current)
      if (next.length) params.set('selected', next.join(','))
      else params.delete('selected')
      return params
    })
  }

  function clear() {
    setSearchParams((current) => {
      const params = new URLSearchParams(current)
      params.delete('selected')
      return params
    })
  }

  return { selected, toggle, clear, max: MAX_COMPARE }
}
