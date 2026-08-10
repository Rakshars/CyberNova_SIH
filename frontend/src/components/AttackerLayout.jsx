import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Terminal, Shield, Skull, Zap, Home } from 'lucide-react'
import RedLoadingScreen from './RedLoadingScreen'

const NAV = [
  {
    to: '/attacker',
    label: 'Payload Injector',
    icon: <Terminal size={18} />,
  },
]

export default function AttackerLayout() {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  return (
    <>
      {loading && <RedLoadingScreen onFinished={() => setLoading(false)} />}

      <div className="layout attacker-theme" style={{ background: '#070002', color: '#f3f4f6' }}>
        <aside className="sidebar" style={{ background: '#0e0104', borderRight: '1px solid rgba(255, 42, 109, 0.25)' }}>
          <div className="sidebar-logo" style={{ borderBottom: '1px solid rgba(255, 42, 109, 0.25)' }}>
            <div className="logo-icon" style={{ background: 'transparent', boxShadow: '0 0 15px rgba(255, 42, 109, 0.4)', padding: 0, overflow: 'hidden', borderRadius: '10px' }}>
              <img src="/logo.png" alt="CyberNova Logo" style={{ width: '34px', height: '34px', objectFit: 'contain', filter: 'hue-rotate(160deg) saturate(1.5)', borderRadius: '8px' }} />
            </div>
            <div>
              <div className="logo-text" style={{ background: 'linear-gradient(90deg, #ffffff 0%, #ff2a6d 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Red Team C2
              </div>
              <div className="logo-sub" style={{ color: '#ff2a6d' }}>Offensive Operations</div>
            </div>
          </div>

          <div className="nav-section-label" style={{ color: '#ff2a6d', opacity: 0.8 }}>EXPLOIT TOOLS</div>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/attacker'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              style={{
                borderColor: 'rgba(255, 42, 109, 0.2)'
              }}
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
              gap: 10,
              padding: '10px 14px',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              width: '100%',
              marginBottom: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <Home size={15} />
            ← Back to Home
          </button>

          <NavLink 
            to="/soc" 
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px', 
              color: '#00f2fe',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              borderRadius: 10,
              background: 'rgba(0, 242, 254, 0.08)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              boxShadow: '0 0 15px rgba(0, 242, 254, 0.15)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0, 242, 254, 0.18)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0, 242, 254, 0.08)'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <Shield size={16} />
            Switch to Blue Team SOC
          </NavLink>
        </aside>

        <div className="main">
          <header className="topbar" style={{ borderBottom: '1px solid rgba(255, 42, 109, 0.25)', background: '#0e0104' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={16} color="#ff2a6d" />
              <span className="topbar-title" style={{ color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
                root@red-team:~# ./offensive_c2_simulator
              </span>
            </div>
            <div className="topbar-status" style={{ background: 'rgba(255, 42, 109, 0.12)', border: '1px solid rgba(255, 42, 109, 0.3)' }}>
              <span className="status-dot" style={{ background: '#ff2a6d', boxShadow: '0 0 10px #ff2a6d' }} />
              <span style={{ color: '#ff2a6d', fontWeight: 800 }}>LIVE OFFENSIVE SUBNET</span>
            </div>
          </header>
          <main className="page-content" style={{ background: 'radial-gradient(circle at 50% 0%, #150207 0%, #070002 100%)' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
