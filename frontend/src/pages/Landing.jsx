import { useNavigate } from 'react-router-dom'
import { Shield, Skull, ArrowRight } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'radial-gradient(circle at center, #111827 0%, #030712 100%)',
      color: '#ffffff',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(0, 242, 254, 0.5)'
          }}>
            <Shield size={26} color="#030712" />
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
            CyberNova SOC Platform
          </h1>
        </div>
        <p style={{ color: '#9ca3af', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
          Autonomous AI-Driven Cybersecurity Operations &amp; Threat Containment System
        </p>
      </div>

      {/* Operation Environment Cards */}
      <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '800px', width: '100%' }}>
        
        {/* Blue Team Defender Card */}
        <div 
          onClick={() => navigate('/soc')}
          style={{
            flex: '1 1 320px',
            background: 'rgba(17, 24, 39, 0.85)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '20px',
            padding: '36px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 10px 40px rgba(0, 242, 254, 0.12)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-6px)'
            e.currentTarget.style.borderColor = '#00f2fe'
            e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 242, 254, 0.25)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)'
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 242, 254, 0.12)'
          }}
        >
          <div style={{
            width: '74px',
            height: '74px',
            borderRadius: '20px',
            background: 'rgba(0, 242, 254, 0.12)',
            color: '#00f2fe',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)'
          }}>
            <Shield size={36} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>Blue Team SOC</h2>
          <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>
            Enter the AI Security Operations Command. Triage live threats, monitor network mesh, and review SOAR playbooks.
          </p>
          <div style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#00f2fe',
            fontWeight: 800,
            fontSize: '13px'
          }}>
            LAUNCH SOC DASHBOARD <ArrowRight size={16} />
          </div>
        </div>

        {/* Red Team Attacker Card */}
        <div 
          onClick={() => navigate('/attacker')}
          style={{
            flex: '1 1 320px',
            background: 'rgba(15, 0, 5, 0.85)',
            border: '1px solid rgba(255, 42, 109, 0.35)',
            borderRadius: '20px',
            padding: '36px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 10px 40px rgba(255, 42, 109, 0.12)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-6px)'
            e.currentTarget.style.borderColor = '#ff2a6d'
            e.currentTarget.style.boxShadow = '0 20px 50px rgba(255, 42, 109, 0.25)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'rgba(255, 42, 109, 0.35)'
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(255, 42, 109, 0.12)'
          }}
        >
          <div style={{
            width: '74px',
            height: '74px',
            borderRadius: '20px',
            background: 'rgba(255, 42, 109, 0.12)',
            color: '#ff2a6d',
            border: '1px solid rgba(255, 42, 109, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 0 20px rgba(255, 42, 109, 0.2)'
          }}>
            <Skull size={36} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>Red Team C2</h2>
          <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>
            Enter the Offensive Cyber Command. Inject custom telemetry vectors and emulate live cyber attacks.
          </p>
          <div style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#ff2a6d',
            fontWeight: 800,
            fontSize: '13px'
          }}>
            LAUNCH ATTACK SIMULATOR <ArrowRight size={16} />
          </div>
        </div>

      </div>
    </div>
  )
}
