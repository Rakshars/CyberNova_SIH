import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Terminal, Shield, Activity, Skull } from 'lucide-react'

const NAV = [
  {
    to: '/attacker',
    label: 'Simulator',
    icon: <Terminal size={18} />,
  },
]

export default function AttackerLayout() {
  const location = useLocation()

  return (
    <div className="layout attacker-theme" style={{ background: '#0a0000' }}>
      <aside className="sidebar" style={{ background: '#120202', borderRight: '1px solid #330000' }}>
        <div className="sidebar-logo" style={{ borderBottom: '1px solid #330000' }}>
          <div className="logo-icon" style={{ background: 'var(--critical)' }}>
            <Skull size={16} color="#fff" />
          </div>
          <div>
            <div className="logo-text" style={{ color: 'var(--critical)' }}>Red Team</div>
            <div className="logo-sub">Offensive Operations</div>
          </div>
        </div>

        <div className="nav-section-label" style={{ color: '#883333' }}>Tools</div>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/attacker'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {icon}
            {label}
          </NavLink>
        ))}

        <div style={{ flex: 1 }} />
        
        <NavLink 
          to="/" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px', 
            color: '#883333', fontSize: 13, textDecoration: 'none',
            borderRadius: 6,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,0,0,0.1)'
            e.currentTarget.style.color = 'var(--critical)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#883333'
          }}
        >
          <Shield size={16} />
          Switch to Blue Team
        </NavLink>
      </aside>

      <div className="main">
        <header className="topbar" style={{ borderBottom: '1px solid #330000', background: '#0d0202' }}>
          <span className="topbar-title" style={{ color: 'var(--critical)', fontFamily: 'monospace' }}>
            root@red-team:~# ./simulator
          </span>
          <div className="topbar-status">
            <span className="status-dot" style={{ background: 'var(--critical)', boxShadow: '0 0 0 2px rgba(248,81,73,0.25)' }} />
            <span style={{ color: 'var(--critical)' }}>Live</span>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
