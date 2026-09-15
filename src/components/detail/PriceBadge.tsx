import { formatPrice } from '../../utils/formatPrice'

export function PriceBadge({ price }: { price: number }) {
  return <span className="price-badge">{formatPrice(price)}</span>
}
