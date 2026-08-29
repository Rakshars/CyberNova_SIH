import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import CopilotDrawer from './CopilotDrawer'
import CyberLoadingScreen from './CyberLoadingScreen'
import LiveThreatAlert from './LiveThreatAlert'
import { User, LogIn, LogOut, Home, LayoutDashboard, AlertTriangle, Zap, ScanLine, Shield, Users, BookOpen, Bot, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const NAV = [
  { to: '/',           label: 'Dashboard',           icon: <LayoutDashboard size={15} /> },
  { to: '/incidents',  label: 'Incidents',            icon: <AlertTriangle size={15} /> },
  { to: '/events',     label: 'Events Feed',          icon: <Zap size={15} /> },
  { to: '/multimodal', label: 'Multi-Modal Security', icon: <ScanLine size={15} /> },
  { to: '/soar',       label: 'SOAR Playbooks',       icon: <Shield size={15} /> },
  { to: '/users',      label: 'Users & Profiles',     icon: <Users size={15} /> },
  { to: '/knowledge',  label: 'Knowledge Base',       icon: <BookOpen size={15} />, external: true },
]

const PAGE_TITLES = {
  '/':            'Overview Dashboard',
  '/incidents':   'Security Incidents',
  '/events':      'Real-Time Event Stream',
  '/multimodal':  'Multi-Modal Security Hub',
  '/soar':        'SOAR & Autonomous Playbooks',
  '/users':       'User Behavioral Profiles',
  '/knowledge':   'Cyber Knowledge Base',
}

export default function SocLayout() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [isLoading, setIsLoading]     = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const { theme, toggle: toggleTheme } = useTheme()

  useEffect(() => {
    loadSavedUser()
    const handleAuthChange = () => loadSavedUser()
    window.addEventListener('cybernova_auth_change', handleAuthChange)
    return () => window.removeEventListener('cybernova_auth_change', handleAuthChange)
  }, [])

  const loadSavedUser = () => {
    const raw = localStorage.getItem('cybernova_user')
    if (raw) { try { setCurrentUser(JSON.parse(raw)) } catch { setCurrentUser(null) } }
    else setCurrentUser(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('cybernova_user')
    setCurrentUser(null)
    window.dispatchEvent(new Event('cybernova_auth_change'))
    navigate('/login')
  }

  const pageTitle = (() => {
    if (location.pathname.startsWith('/soc/incidents/')) return 'Incident Investigation'
    if (location.pathname.startsWith('/soc/users/'))    return 'User Behavioral Profile'
    const trimmed = location.pathname.replace('/soc', '') || '/'
    return PAGE_TITLES[trimmed] || 'SOC Command'
  })()

  return (
    <>
      {isLoading && <CyberLoadingScreen onFinished={() => setIsLoading(false)} />}
      <LiveThreatAlert />

      <div className="layout">
        <aside className="sidebar">
          {/* Logo */}
          <div className="sidebar-logo">
            <div className="logo-icon">
              <img src="/logo.png" alt="CyberNova" />
            </div>
            <div>
              <div className="logo-text">CyberNova SOC</div>
              <div className="logo-sub">Autonomous Guard</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="sidebar-nav">
            <div className="nav-section-label">Command Modules</div>
            {NAV.map(({ to, label, icon, external }) => (
              <NavLink
                key={to}
                to={external ? to : `/soc${to === '/' ? '' : to}`}
                end={to === '/' || to === '/knowledge'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <button className="nav-item" onClick={() => navigate('/')}>
              <Home size={15} />
              Back to Home
            </button>
            {currentUser ? (
              <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--red)' }}>
                <LogOut size={15} />
                <span style={{ flex: 1, textAlign: 'left' }}>Log Out</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>{currentUser.username}</span>
              </button>
            ) : (
              <NavLink to="/login" className="nav-item">
                <LogIn size={15} />
                Log In / Register
              </NavLink>
            )}
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <span className="topbar-title">{pageTitle}</span>

            <div className="topbar-right">
              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--blue-dim)',
                    border: '1px solid var(--blue-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'var(--blue-light)',
                    flexShrink: 0
                  }}>
                    {currentUser.username?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ lineHeight: 1.3 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{currentUser.username}</div>
                    {currentUser.department && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{currentUser.department}</div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Log Out"
                    style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4, transition: 'color var(--t)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              ) : (
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>
                  <User size={13} /> Login
                </button>
              )}

              <button
                className="btn btn-primary btn-sm"
                onClick={() => setCopilotOpen(true)}
                style={{ gap: 6 }}
              >
                <Bot size={13} />
                AI Sentinel Copilot
              </button>

              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <div className="topbar-status">
                <span className="status-dot" />
                Autonomous Active
              </div>
            </div>
          </header>

          <main className="page-content" style={{ position: 'relative' }}>
            <Outlet />
          </main>
        </div>

        <CopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
      </div>
    </>
  )
}
