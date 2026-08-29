import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Terminal, Shield, Zap, Home } from 'lucide-react'
import RedLoadingScreen from './RedLoadingScreen'

// ── Attacker palette ──────────────────────────────────────────
// Base:    #0c0e12  (near-black with a cool undertone)
// Surface: #13161d  (sidebar / topbar)
// Accent:  #e86c2a  (burnt orange — readable, not neon)
// Border:  rgba(232,108,42,0.18)
// Text:    #d4d8e0 / rgba(255,255,255,0.45)
// ─────────────────────────────────────────────────────────────

const A = {
  bg:         '#0c0e12',
  surface:    '#13161d',
  surface2:   '#191d26',
  accent:     '#e86c2a',
  accentDim:  'rgba(232,108,42,0.10)',
  accentBorder:'rgba(232,108,42,0.22)',
  border:     'rgba(255,255,255,0.07)',
  text:       '#d4d8e0',
  textSub:    'rgba(255,255,255,0.40)',
}

const NAV = [
  { to: '/attacker', label: 'Payload Injector', icon: <Terminal size={15} /> },
]

export default function AttackerLayout() {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  return (
    <>
      {loading && <RedLoadingScreen onFinished={() => setLoading(false)} />}

      <div className="layout" style={{ background: A.bg, color: A.text }}>

        {/* ── Sidebar ── */}
        <aside className="sidebar" style={{ background: A.surface, borderRight: `1px solid ${A.border}` }}>

          {/* Logo */}
          <div className="sidebar-logo" style={{ borderBottom: `1px solid ${A.border}` }}>
            <div className="logo-icon" style={{
              background: 'transparent', border: `1px solid ${A.accentBorder}`,
              borderRadius: 7, overflow: 'hidden'
            }}>
              <img src="/logo.png" alt="CyberNova" style={{ width: 32, height: 32, objectFit: 'contain', display: 'block' }} />
            </div>
            <div>
              <div className="logo-text" style={{ color: A.text }}>Red Team C2</div>
              <div className="logo-sub" style={{ color: A.accent, opacity: 0.85 }}>Offensive Operations</div>
            </div>
          </div>

          {/* Nav */}
          <div className="sidebar-nav">
            <div className="nav-section-label" style={{ color: A.textSub }}>Exploit Tools</div>
            {NAV.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                style={({ isActive }) => ({
                  color: isActive ? A.accent : A.textSub,
                  background: isActive ? A.accentDim : 'transparent',
                  borderRadius: 5,
                })}
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: 8, borderTop: `1px solid ${A.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 5,
                background: 'transparent', border: `1px solid ${A.border}`,
                color: A.textSub, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', width: '100%', fontFamily: 'inherit',
                transition: 'color 0.15s, border-color 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = A.text; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.color = A.textSub; e.currentTarget.style.borderColor = A.border }}
            >
              <Home size={14} />
              Back to Home
            </button>

            <NavLink
              to="/soc"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 5,
                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.20)',
                color: '#60a5fa', fontSize: 13, fontWeight: 500, textDecoration: 'none'
              }}
            >
              <Shield size={14} />
              Switch to Blue Team SOC
            </NavLink>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main">
          <header className="topbar" style={{ background: A.surface, borderBottom: `1px solid ${A.border}`, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <Zap size={14} color={A.accent} style={{ flexShrink: 0 }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                color: A.textSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                <span style={{ color: A.accent }}>root@red-team</span>
                <span>:~# ./c2_simulator</span>
              </span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 99,
              background: A.accentDim, border: `1px solid ${A.accentBorder}`,
              flexShrink: 0
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: A.accent, display: 'block',
                animation: 'pulseDot 2s infinite'
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: A.accent, whiteSpace: 'nowrap' }}>
                OFFENSIVE SUBNET LIVE
              </span>
            </div>
          </header>

          <main className="page-content" style={{ background: A.bg }}>
            <Outlet />
          </main>
        </div>

      </div>
    </>
  )
}
