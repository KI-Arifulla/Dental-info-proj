import type { PriceRange } from '../../data/types'
import { formatPrice } from '../../utils/formatPrice'

export function PriceBadge({ priceRange }: { priceRange: PriceRange }) {
  return <span className="price-badge">{formatPrice(priceRange)}</span>
}
