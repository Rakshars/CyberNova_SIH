import React, { useEffect, useState } from 'react'
import { Skull } from 'lucide-react'

export default function RedLoadingScreen({ onFinished }) {
  const [step, setStep] = useState(0)
  const logs = [
    'INITIATING RED TEAM OFFENSIVE C2 FRAMEWORK...',
    'ESTABLISHING ENCRYPTED TOR PROXY TUNNEL [185.220.140.197]...',
    'COMPILING SCENARIO EXPLOITS & ZERO-DAY INJECTION VECTORS...',
    'CONNECTING TO AUTONOMOUS SOC TARGET SUBNET [192.168.1.0/24]...',
    'OFFENSIVE RED TEAM C2 OPERATIONAL.'
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => {
        if (prev < logs.length - 1) return prev + 1
        clearInterval(timer)
        setTimeout(() => {
          if (onFinished) onFinished()
        }, 400)
        return prev
      })
    }, 350)

    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#070002',
      color: '#ff2a6d',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace",
      padding: '24px'
    }}>

      {/* Pulsating Crimson Tactical Radar Ring */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Outer Rotating Radar Ring */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '2px dashed rgba(255, 42, 109, 0.4)',
          borderTopColor: '#ff2a6d',
          animation: 'redRadarSpin 1.5s linear infinite'
        }} />

        {/* Inner Pulsating Circle */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 42, 109, 0.3) 0%, rgba(10, 0, 0, 0.9) 100%)',
          border: '2px solid #ff2a6d',
          boxShadow: '0 0 35px #ff2a6d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'redPulse 1.2s infinite'
        }}>
          <Skull size={38} color="#ff2a6d" />
        </div>
      </div>

      {/* Header */}
      <h1 style={{
        fontSize: '22px',
        fontWeight: 800,
        letterSpacing: '3px',
        color: '#fff',
        marginBottom: '4px',
        textTransform: 'uppercase',
        textShadow: '0 0 15px rgba(255,42,109,0.8)'
      }}>
        RED TEAM OFFENSIVE C2
      </h1>
      <div style={{ fontSize: '12px', color: '#ff2a6d', opacity: 0.8, marginBottom: '24px' }}>
        CLASSIFIED ATTACK SIMULATION ENGINE v2.4
      </div>

      {/* Terminal Log Console */}
      <div style={{
        width: '100%',
        maxWidth: '540px',
        background: 'rgba(15, 0, 4, 0.95)',
        border: '1px solid rgba(255, 42, 109, 0.3)',
        borderRadius: '10px',
        padding: '16px',
        boxShadow: '0 0 30px rgba(255, 42, 109, 0.15)'
      }}>
        {logs.slice(0, step + 1).map((log, idx) => (
          <div key={idx} style={{
            fontSize: '11px',
            lineHeight: '1.8',
            color: idx === step ? '#fff' : 'rgba(255, 42, 109, 0.7)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: '#ff2a6d', fontWeight: 'bold' }}>[+]</span>
            <span>{log}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes redRadarSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes redPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 25px #ff2a6d; }
          50% { transform: scale(1.1); box-shadow: 0 0 45px #ff2a6d; }
        }
      `}</style>
    </div>
  )
}
