import { useNavigate } from 'react-router-dom'
import { Shield, Skull } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'radial-gradient(circle at center, var(--surface-2) 0%, var(--bg) 100%)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M8 1L14.5 4.5V8C14.5 11.5 11.5 14.5 8 15C4.5 14.5 1.5 11.5 1.5 8V4.5L8 1Z" strokeLinejoin="round" />
              <path d="M5 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ fontSize: 32, margin: 0, letterSpacing: '-0.02em', color: 'var(--text)' }}>Autonomous SOC</h1>
        </div>
        <p style={{ color: 'var(--text-sub)', fontSize: 16 }}>Select your operational environment</p>
      </div>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900 }}>
        
        {/* Defender Card */}
        <button 
          onClick={() => navigate('/soc')}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--accent-dim)',
            borderRadius: '16px',
            padding: '40px',
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 10px 40px -10px rgba(59, 130, 246, 0.1)',
            outline: 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(59, 130, 246, 0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'var(--accent-dim)'
            e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(59, 130, 246, 0.1)'
          }}
        >
          <div style={{ width: 80, height: 80, borderRadius: '20px', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Shield size={40} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Blue Team</h2>
          <p style={{ color: 'var(--text-sub)', fontSize: 14, lineHeight: 1.5 }}>
            Enter the SOC Dashboard. Triage alerts, hunt for anomalies, and manage security incidents.
          </p>
        </button>

        {/* Attacker Card */}
        <button 
          onClick={() => navigate('/attacker')}
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(248, 81, 73, 0.15)',
            borderRadius: '16px',
            padding: '40px',
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 10px 40px -10px rgba(248, 81, 73, 0.1)',
            outline: 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = 'var(--critical)'
            e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(248, 81, 73, 0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'rgba(248, 81, 73, 0.15)'
            e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(248, 81, 73, 0.1)'
          }}
        >
          <div style={{ width: 80, height: 80, borderRadius: '20px', background: 'rgba(248, 81, 73, 0.1)', color: 'var(--critical)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Skull size={40} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Red Team</h2>
          <p style={{ color: 'var(--text-sub)', fontSize: 14, lineHeight: 1.5 }}>
            Enter the Attacker Console. Simulate cyberattacks and test the ML anomaly detection engine.
          </p>
        </button>

      </div>
    </div>
  )
}
