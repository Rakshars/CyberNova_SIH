import { useNavigate } from 'react-router-dom'
import { Shield, Skull, BookOpen, ArrowRight, Activity, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const CARDS = [
  {
    route: '/soc',
    icon: <Shield size={26} />,
    title: 'Blue Team SOC',
    tag: 'Defender',
    desc: 'AI Security Operations Command. Triage live threats, monitor network mesh, and review SOAR playbooks in real time.',
    cta: 'Launch SOC Dashboard',
    color: '#1a56db',
    colorDim: 'rgba(26,86,219,0.10)',
    colorBorder: 'rgba(26,86,219,0.22)',
  },
  {
    route: '/attacker',
    icon: <Skull size={26} />,
    title: 'Red Team C2',
    tag: 'Offensive',
    desc: 'Offensive Cyber Command. Inject custom telemetry vectors and emulate live cyber attacks against the SOC.',
    cta: 'Launch Attack Simulator',
    color: '#e84040',
    colorDim: 'rgba(232,64,64,0.10)',
    colorBorder: 'rgba(232,64,64,0.22)',
  },
  {
    route: '/knowledge',
    icon: <BookOpen size={26} />,
    title: 'Knowledge Base',
    tag: 'Reference',
    desc: 'Explore cybersecurity concepts, attack techniques, vulnerabilities, defenses, and threat intelligence.',
    cta: 'Explore Knowledge Base',
    color: '#a855f7',
    colorDim: 'rgba(168,85,247,0.10)',
    colorBorder: 'rgba(168,85,247,0.22)',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const { theme, toggle: toggleTheme } = useTheme()

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 52, maxWidth: 560 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(26,86,219,0.10)', border: '1px solid rgba(26,86,219,0.22)',
          borderRadius: 99, padding: '4px 12px', marginBottom: 20,
          fontSize: 11, fontWeight: 600, color: 'var(--blue-light)', letterSpacing: '0.04em'
        }}>
          <Activity size={11} />
          AUTONOMOUS AI SOC PLATFORM
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            overflow: 'hidden', flexShrink: 0,
            border: '1px solid var(--border)',
          }}>
            <img src="/logo.png" alt="CyberNova" style={{ width: 48, height: 48, objectFit: 'contain', display: 'block' }} />
          </div>
          <h1 style={{
            fontSize: 30, fontWeight: 800, margin: 0,
            letterSpacing: '-0.03em', color: 'var(--text)',
            lineHeight: 1.1
          }}>
            CyberNova SOC Platform
          </h1>
        </div>

        <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Autonomous AI-driven cybersecurity operations, real-time threat detection,
          and instant SOAR containment — all in one command center.
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'flex', gap: 18, flexWrap: 'wrap',
        justifyContent: 'center', maxWidth: 1060, width: '100%'
      }}>
        {CARDS.map(({ route, icon, title, tag, desc, cta, color, colorDim, colorBorder }) => (
          <div
            key={route}
            onClick={() => navigate(route)}
            style={{
              flex: '1 1 300px', maxWidth: 330,
              background: 'var(--surface)',
              border: `1px solid ${colorBorder}`,
              borderRadius: 12,
              padding: '26px 22px',
              display: 'flex', flexDirection: 'column',
              cursor: 'pointer',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.borderColor = color
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = colorBorder
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 8,
                background: colorDim, color,
                border: `1px solid ${colorBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {icon}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                color, background: colorDim,
                border: `1px solid ${colorBorder}`,
                padding: '2px 8px', borderRadius: 99,
                textTransform: 'uppercase'
              }}>
                {tag}
              </span>
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.01em' }}>
              {title}
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.65, marginBottom: 22, flex: 1 }}>
              {desc}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, fontWeight: 600, fontSize: 13 }}>
              {cta} <ArrowRight size={13} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>CyberNova Sentinel · Autonomous AI Security Operations</p>
        <button
          onClick={toggleTheme}
          style={{
            width: 32, height: 32, borderRadius: 'var(--r-sm)',
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text-2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer'
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </div>
  )
}
