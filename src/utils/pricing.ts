const STORAGE_KEY = 'nandini-dental-care.pricing-overrides'

function readOverrides(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] >= 0,
      ),
    )
  } catch {
    return {}
  }
}

export function getEffectivePrice(
  treatmentId: string,
  optionId: string,
  defaultPrice: number,
): number {
  return readOverrides()[`${treatmentId}.${optionId}`] ?? defaultPrice
}

export function getAllOverrides(): Record<string, number> {
  return readOverrides()
}

export function setOverride(treatmentId: string, optionId: string, price: number | null): void {
  const overrides = readOverrides()
  const key = `${treatmentId}.${optionId}`

  if (price === null) {
    delete overrides[key]
  } else if (Number.isFinite(price) && price >= 0) {
    overrides[key] = price
  } else {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    // Storage can be unavailable in private browsing or when its quota is exhausted.
  }
}
