import { Outlet, NavLink, useLocation } from 'react-router-dom'

const NAV = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="6" height="6" rx="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/incidents',
    label: 'Incidents',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2L14 13H2L8 2Z" />
        <path d="M8 6v3M8 11v.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/events',
    label: 'Events',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 4h12M2 8h8M2 12h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/users',
    label: 'Users',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="5" r="3" />
        <path d="M2 14c0-3.31 2.686-6 6-6s6 2.69 6 6" strokeLinecap="round" />
      </svg>
    ),
  },
]

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/incidents': 'Incidents',
  '/events': 'Events',
  '/users': 'Users',
}

export default function SocLayout() {
  const location = useLocation()

  const pageTitle = (() => {
    if (location.pathname.startsWith('/incidents/')) return 'Incident Detail'
    if (location.pathname.startsWith('/users/')) return 'User Profile'
    if (location.pathname === '/simulate') return 'Attack Simulator'
    return PAGE_TITLES[location.pathname] || ''
  })()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 1L14.5 4.5V8C14.5 11.5 11.5 14.5 8 15C4.5 14.5 1.5 11.5 1.5 8V4.5L8 1Z" strokeLinejoin="round" />
              <path d="M5 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="logo-text">SOC Platform</div>
            <div className="logo-sub">Autonomous</div>
          </div>
        </div>

        <div className="nav-section-label">Monitor</div>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={`/soc${to === '/' ? '' : to}`}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="topbar-title">{pageTitle}</span>
          <div className="topbar-status">
            <span className="status-dot" />
            Live
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
