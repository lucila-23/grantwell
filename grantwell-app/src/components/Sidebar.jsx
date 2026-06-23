import { NavLink } from 'react-router-dom'
import { getUser } from '../api'
import './Sidebar.css'

export default function Sidebar({ onLogout }) {
  const user = getUser()
  const initials = user?.contact_name
    ? user.contact_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'P'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">P</div>
        <span className="brand-name">POLEN</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-label">Oportunidades</div>
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <span className="nav-icon">🎯</span>
            Grants Disponibles
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Gestion</div>
          <NavLink to="/applications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📋</span>
            Mis Postulaciones
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🏢</span>
            Mi Organizacion
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.contact_name || 'Usuario'}</div>
            <div className="user-org">{user?.name || ''}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>Salir</button>
      </div>
    </aside>
  )
}
