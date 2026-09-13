import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="app-header">
      <Link to="/" className="app-title">
        Dental Treatment Explorer
      </Link>
    </header>
  )
}
