import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLatestThreat } from '../api'

/**
 * LiveThreatAlert
 * ---------------
 * Sits globally inside SocLayout. Polls /api/incidents/latest-threat
 * every 3 seconds. When a NEW incident appears (id differs from last seen),
 * it slides in a dramatic "ATTACK DETECTED" briefing panel.
 *
 * The panel explains:
 *  - What the attacker is doing
 *  - What CyberNova AI is doing to stop it
 */
export default function LiveThreatAlert() {
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [visible, setVisible] = useState(false)
  const [aiTextIdx, setAiTextIdx] = useState(0)
  const lastSeenId = useRef(null)
  const dismissTimer = useRef(null)
  const typewriterTimer = useRef(null)

  /* Poll backend every 3 seconds */
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await getLatestThreat()
        const inc = data?.incident
        if (!inc) return
        if (inc.id !== lastSeenId.current) {
          lastSeenId.current = inc.id
          showThreatAlert(inc)
        }
      } catch (_) {}
    }

    const initialDelay = setTimeout(poll, 2000)
    const interval = setInterval(poll, 3000)
    return () => {
      clearTimeout(initialDelay)
      clearInterval(interval)
    }
  }, [])

  const showThreatAlert = (inc) => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    if (typewriterTimer.current) clearInterval(typewriterTimer.current)

    setAlert(inc)
    setAiTextIdx(0)
    setVisible(true)

    const fullText = inc.ai_response || ''
    let idx = 0
    typewriterTimer.current = setInterval(() => {
      idx += 3
      setAiTextIdx(idx)
      if (idx >= fullText.length) clearInterval(typewriterTimer.current)
    }, 30)

    dismissTimer.current = setTimeout(() => dismiss(), 18000)
  }

  const dismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    if (typewriterTimer.current) clearInterval(typewriterTimer.current)
    setVisible(false)
    setTimeout(() => setAlert(null), 500)
  }

  if (!alert) return null

  const color = alert.severity_color || '#ff2a6d'
  const aiText = (alert.ai_response || '').slice(0, aiTextIdx)
  const isTyping = aiTextIdx < (alert.ai_response || '').length

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 9998,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease',
          backdropFilter: 'blur(5px)',
        }}
      />

      {/* Alert Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: visible
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -50%) scale(0.85)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
          zIndex: 9999,
          width: 'min(780px, 94vw)',
          background: '#07000d',
          border: `1.5px solid ${color}`,
          borderRadius: '20px',
          boxShadow: `0 0 80px ${color}40, 0 0 200px ${color}15`,
          overflow: 'hidden',
          fontFamily: "'Inter', 'Outfit', sans-serif",
        }}
      >
        {/* Scanning stripe animation */}
        <div style={{
          height: '2px',
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
          animation: 'scanStripe 1.6s ease-in-out infinite',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 22px',
          background: `${color}12`,
          borderBottom: `1px solid ${color}30`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10,
              borderRadius: '50%', background: color,
              boxShadow: `0 0 12px ${color}`,
              animation: 'blinkPulse 0.8s ease-in-out infinite alternate',
            }} />
            <span style={{
              fontSize: '11px', fontWeight: 900, letterSpacing: '2px',
              color: color, textTransform: 'uppercase',
            }}>
              ⚡ CyberNova AI — Live Threat Detected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {alert.mitre_id && (
              <span style={{
                fontSize: '10px', fontWeight: 800,
                background: `${color}22`, border: `1px solid ${color}55`,
                color: color, padding: '3px 10px',
                borderRadius: '99px', letterSpacing: '1px',
              }}>
                MITRE {alert.mitre_id}
              </span>
            )}
            <button onClick={dismiss} style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.5)',
              borderRadius: '6px', width: 28, height: 28,
              cursor: 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ fontSize: '32px', lineHeight: 1 }}>{alert.icon}</span>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                {alert.attack_name}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '5px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span>Target: <strong style={{ color: '#fff' }}>{alert.affected_username}</strong></span>
                <span>IP: <strong style={{ color: color, fontFamily: 'monospace' }}>{alert.affected_ip}</strong></span>
                <span>Risk Score: <strong style={{ color: color }}>{alert.risk_score}/100</strong></span>
                <span style={{
                  background: color === '#ff2a6d' ? 'rgba(255,42,109,0.15)' : `${color}20`,
                  border: `1px solid ${color}55`,
                  color: color, padding: '1px 8px', borderRadius: '99px', fontWeight: 800,
                }}>
                  {(alert.severity || 'HIGH').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Attacker explanation */}
            <div style={{
              background: 'rgba(255,42,109,0.06)',
              border: '1px solid rgba(255,42,109,0.25)',
              borderRadius: '12px', padding: '20px',
            }}>
              <div style={{
                fontSize: '11px', fontWeight: 900, letterSpacing: '1.5px',
                color: '#ff4d7d', marginBottom: '12px', textTransform: 'uppercase',
              }}>
                🔴 What the Attacker is Doing
              </div>
              <p style={{ fontSize: '14.5px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: 0 }}>
                {alert.attack_explanation}
              </p>
            </div>

            {/* AI response */}
            <div style={{
              background: `${color}08`,
              border: `1px solid ${color}30`,
              borderRadius: '12px', padding: '20px',
            }}>
              <div style={{
                fontSize: '11px', fontWeight: 900, letterSpacing: '1.5px',
                color: color, marginBottom: '12px', textTransform: 'uppercase',
              }}>
                🤖 What CyberNova AI is Doing
              </div>
              <p style={{
                fontSize: '14.5px',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.7, margin: 0,
                fontFamily: isTyping ? "'JetBrains Mono', monospace" : 'inherit',
              }}>
                {aiText}
                {isTyping && (
                  <span style={{
                    display: 'inline-block', width: '3px', height: '16px',
                    background: color, marginLeft: '3px', verticalAlign: 'middle',
                    animation: 'blinkPulse 0.5s ease-in-out infinite alternate',
                  }} />
                )}
              </p>
            </div>
          </div>

          {/* SOAR actions */}
          {alert.response_taken && alert.response_taken.length > 0 && (
            <div style={{
              background: 'rgba(5,255,161,0.04)',
              border: '1px solid rgba(5,255,161,0.15)',
              borderRadius: '8px', padding: '10px 14px',
              marginTop: '4px'
            }}>
              <div style={{
                fontSize: '9px', fontWeight: 900, letterSpacing: '1.5px',
                color: '#05ffa1', marginBottom: '6px', textTransform: 'uppercase',
              }}>
                ⚡ SOAR Auto-Containment Actions Executed
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {alert.response_taken.map((action, i) => {
                  // Format the action beautifully instead of dumping JSON
                  const label = typeof action === 'string' 
                    ? action 
                    : (action.policy_name || action.action_type || action.action || 'Containment Action Triggered')
                  return (
                    <span key={i} style={{
                      fontSize: '10px',
                      background: 'rgba(5,255,161,0.08)',
                      border: '1px solid rgba(5,255,161,0.25)',
                      color: '#05ffa1', padding: '3px 8px',
                      borderRadius: '4px', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <span style={{ fontSize: '10px' }}>✓</span> {label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button onClick={dismiss} style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.55)',
              padding: '9px 20px', borderRadius: '10px',
              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            }}>
              Dismiss
            </button>
            <button
              onClick={() => { dismiss(); navigate(`/soc/incidents/${alert.incident_id}`) }}
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)`,
                border: 'none', color: '#fff',
                padding: '9px 22px', borderRadius: '10px',
                fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                boxShadow: `0 0 20px ${color}55`,
              }}
            >
              View Full Incident Report →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blinkPulse {
          from { opacity: 1; }
          to   { opacity: 0.25; }
        }
        @keyframes scanStripe {
          0%   { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  )
}
