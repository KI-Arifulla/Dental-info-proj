import { NavLink, useNavigate } from 'react-router-dom'
import { CLINIC_NAME } from '../../config/appConfig'
import { useAuth } from '../../context/useAuth'

export function Header() {
  const { lock } = useAuth()
  const navigate = useNavigate()

  function handleLock() {
    lock()
    navigate('/')
  }

  return (
    <nav className="app-nav" aria-label="Main navigation">
      <NavLink to="/treatments" className="app-nav-brand">
        {CLINIC_NAME}
      </NavLink>
      <div className="app-nav-links">
        <NavLink to="/treatments">Treatments</NavLink>
        <NavLink to="/settings">Settings</NavLink>
        <button type="button" className="app-nav-lock" onClick={handleLock}>
          Lock
        </button>
      </div>
    </nav>
  )
}
