import React, { useEffect, useState, useRef } from 'react'

export default function CyberLoadingScreen({ onFinished }) {
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('INITIALIZING CYBERNOVA THREAT ENGINE...')
  const [fading, setFading] = useState(false)

  const onFinishedRef = useRef(onFinished)
  useEffect(() => { onFinishedRef.current = onFinished })

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
          if (onFinishedRef.current) onFinishedRef.current()
        }, 800)
      }
    }, 450)

    return () => clearInterval(interval)
  }, [])

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

        {/* Center Logo Icon */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(0, 242, 254, 0.7), 0 0 60px rgba(0, 242, 254, 0.3)',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(0, 242, 254, 0.4)'
        }}>
          <img
            src="/logo.png"
            alt="CyberNova"
            style={{ width: '64px', height: '64px', objectFit: 'contain' }}
          />
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
