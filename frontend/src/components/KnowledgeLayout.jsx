import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import CopilotDrawer from './CopilotDrawer'
import CyberLoadingScreen from './CyberLoadingScreen'
import { User, LogIn, LogOut, Home, Menu, X } from 'lucide-react'

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
    label: 'Events Feed',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 4h12M2 8h8M2 12h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/multimodal',
    label: 'Multi-Modal Security',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4v8M4 8h8" />
      </svg>
    ),
  },
  {
    to: '/soar',
    label: 'SOAR Playbooks',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 8h10M8 3v10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/users',
    label: 'Users & Profiles',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="5" r="3" />
        <path d="M2 14c0-3.31 2.686-6 6-6s6 2.69 6 6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/knowledge',
    label: 'Knowledge Base',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 2h10a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H3a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 3 2z" />
        <path d="M5 5h6M5 8h6M5 11h4" strokeLinecap="round" />
      </svg>
    ),
    external: true,
  },
]

export default function KnowledgeLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    loadSavedUser()
    const handleAuthChange = () => loadSavedUser()
    window.addEventListener('cybernova_auth_change', handleAuthChange)
    return () => window.removeEventListener('cybernova_auth_change', handleAuthChange)
  }, [])

  // Close sidebar on route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Scroll lock when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const loadSavedUser = () => {
    const raw = localStorage.getItem('cybernova_user')
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw))
      } catch (e) {
        setCurrentUser(null)
      }
    } else {
      setCurrentUser(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('cybernova_user')
    setCurrentUser(null)
    window.dispatchEvent(new Event('cybernova_auth_change'))
    navigate('/login')
  }

  const pageTitle = (() => {
    if (location.pathname.startsWith('/knowledge/topic/')) return 'Knowledge Base Article'
    if (location.pathname.startsWith('/knowledge/category/')) return 'Knowledge Base Category'
    if (location.pathname.startsWith('/knowledge/search')) return 'Knowledge Base Search'
    return 'Cyber Knowledge Base'
  })()

  return (
    <>
      {isLoading && <CyberLoadingScreen onFinished={() => setIsLoading(false)} />}

      <div className="layout kb-layout">
        {sidebarOpen && (
          <div 
            className="sidebar-overlay" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`sidebar kb-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-mobile-header">
            <button 
              className="sidebar-close-btn" 
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="sidebar-logo">
            <div className="logo-icon" style={{ background: 'transparent', boxShadow: 'none', padding: 0, overflow: 'hidden' }}>
              <img src="/logo.png" alt="CyberNova SOC Logo" style={{ width: '34px', height: '34px', objectFit: 'contain', borderRadius: '8px' }} />
            </div>
            <div>
              <div className="logo-text">CyberNova SOC</div>
              <div className="logo-sub">Autonomous Guard</div>
            </div>
          </div>

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

          <div style={{ flex: 1 }} />

          {/* Back to Landing Page */}
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'var(--blue-dim)',
              border: '1px solid var(--blue-border)',
              color: 'var(--blue-light)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s',
              marginBottom: '6px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--blue-dim)'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 0 14px var(--blue-border)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--blue-dim)'
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Home size={15} />
            ← Back to Home
          </button>

          {/* User Auth & Logout Link in Sidebar Footer */}
          {currentUser ? (
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 42, 109, 0.1)',
                border: '1px solid rgba(255, 42, 109, 0.3)',
                color: 'var(--critical)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '10px',
                width: '100%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 42, 109, 0.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 42, 109, 0.1)'
              }}
            >
              <LogOut size={15} />
              Log Out ({currentUser.username})
            </button>
          ) : (
            <NavLink
              to="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-sub)',
                color: 'var(--accent)',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                marginTop: '10px'
              }}
            >
              <LogIn size={15} />
              Log In / Register User
            </NavLink>
          )}
        </aside>

        <div className="main">
          <header className="topbar">
            <button 
              className="mobile-menu-btn" 
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="topbar-title">{pageTitle}</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Authenticated User Indicator Badge */}
              {currentUser ? (
                <div
                  className="topbar-user-badge"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(0, 242, 254, 0.1)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    padding: '4px 12px',
                    borderRadius: '99px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text)'
                  }}
                >
                  <User size={14} color="var(--accent)" />
                  <span>{currentUser.username}</span>
                  <span style={{ color: 'var(--text-sub)', fontSize: '10px' }}>({currentUser.department || 'User'})</span>
                  
                  <button
                    onClick={handleLogout}
                    title="Log Out"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-sub)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: '4px',
                      padding: '2px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--critical)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-sub)',
                    color: 'var(--text-2)',
                    padding: '4px 10px',
                    borderRadius: '99px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  👤 Login / Register
                </button>
              )}

              <button
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px' }}
                onClick={() => setCopilotOpen(true)}
              >
                🤖 AI Sentinel Copilot
              </button>

              <div className="topbar-status">
                <span className="status-dot" />
                <span className="status-text">Autonomous Active</span>
              </div>
            </div>
          </header>

          <main className="page-content" style={{ position: 'relative' }}>
            <Outlet />
          </main>
        </div>

        {/* Global AI Copilot Assistant Drawer */}
        <CopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
      </div>
    </>
  )
}
