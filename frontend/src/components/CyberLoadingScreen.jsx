import React, { useEffect, useState } from 'react'

export default function CyberLoadingScreen({ onFinished }) {
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('INITIALIZING CYBERNOVA THREAT ENGINE...')
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const statuses = [
      'INITIALIZING CYBERNOVA THREAT ENGINE...',
      'LOADING ML ISOLATION FOREST MODELS...',
      'CONNECTING BHARAT FINTECH UPI MONITOR...',
      'SYNCING AUTONOMOUS SOAR PLAYBOOKS...',
      'SOC CYBER COMMAND CENTER READY'
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      if (currentStep < statuses.length) {
        setStatusText(statuses[currentStep])
        setProgress((currentStep / (statuses.length - 1)) * 100)
      } else {
        clearInterval(interval)
        setTimeout(() => setFading(true), 300)
        setTimeout(() => {
          if (onFinished) onFinished()
        }, 800)
      }
    }, 450)

    return () => clearInterval(interval)
  }, [onFinished])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#030712',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      opacity: fading ? 0 : 1,
      transform: fading ? 'scale(1.05)' : 'scale(1)',
      pointerEvents: fading ? 'none' : 'auto'
    }}>
      {/* Background Cyber Grid */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 50%, rgba(0, 242, 254, 0.08), transparent 70%), linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      {/* Rotating Shield Logo Container */}
      <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '32px' }}>
        {/* Outer Laser Spinner */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#00f2fe',
          borderRightColor: '#05ffa1',
          animation: 'cyberSpin 1.2s linear infinite',
          boxShadow: '0 0 25px rgba(0, 242, 254, 0.4)'
        }} />

        {/* Counter Ring */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          border: '1px dashed rgba(255, 42, 109, 0.5)',
          animation: 'cyberSpinReverse 2.5s linear infinite'
        }} />

        {/* Center Shield Icon */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #00f2fe 0%, #ff2a6d 100%)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(0, 242, 254, 0.6)'
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#030712" strokeWidth="2.5" style={{ width: 32, height: 32 }}>
            <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Brand Name */}
      <h1 style={{
        fontSize: '24px',
        fontWeight: 800,
        letterSpacing: '0.1em',
        background: 'linear-gradient(90deg, #ffffff 0%, #00f2fe 50%, #05ffa1 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '8px',
        textTransform: 'uppercase'
      }}>
        CYBERNOVA SOC
      </h1>

      <p style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.2em',
        color: '#8b949e',
        textTransform: 'uppercase',
        marginBottom: '24px'
      }}>
        Autonomous Cyber Guard System
      </p>

      {/* Progress Bar Container */}
      <div style={{ width: '280px', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '99px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #00f2fe 0%, #05ffa1 100%)',
          borderRadius: '99px',
          transition: 'width 0.4s ease',
          boxShadow: '0 0 12px #00f2fe'
        }} />
      </div>

      {/* Status Text */}
      <div style={{
        fontSize: '11px',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#00f2fe',
        letterSpacing: '0.05em'
      }}>
        {statusText}
      </div>

      {/* Keyframe animation styles inline */}
      <style>{`
        @keyframes cyberSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes cyberSpinReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
