import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLatestThreat } from '../api'

export default function LiveThreatAlert() {
  const navigate = useNavigate()
  const [alert, setAlert]     = useState(null)
  const [visible, setVisible] = useState(false)
  const [aiTextIdx, setAiTextIdx] = useState(0)
  const lastSeenId       = useRef(null)
  const dismissTimer     = useRef(null)
  const typewriterTimer  = useRef(null)

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await getLatestThreat()
        const inc = data?.incident
        if (!inc) return
        if (inc.id !== lastSeenId.current) {
          lastSeenId.current = inc.id
          showAlert(inc)
        }
      } catch (_) {}
    }
    const t = setTimeout(poll, 2000)
    const iv = setInterval(poll, 3000)
    return () => { clearTimeout(t); clearInterval(iv) }
  }, [])

  const showAlert = (inc) => {
    if (dismissTimer.current)    clearTimeout(dismissTimer.current)
    if (typewriterTimer.current) clearInterval(typewriterTimer.current)
    setAlert(inc); setAiTextIdx(0); setVisible(true)
    let idx = 0
    const full = inc.ai_response || ''
    typewriterTimer.current = setInterval(() => {
      idx += 3; setAiTextIdx(idx)
      if (idx >= full.length) clearInterval(typewriterTimer.current)
    }, 30)
    dismissTimer.current = setTimeout(dismiss, 18000)
  }

  const dismiss = () => {
    if (dismissTimer.current)    clearTimeout(dismissTimer.current)
    if (typewriterTimer.current) clearInterval(typewriterTimer.current)
    setVisible(false)
    setTimeout(() => setAlert(null), 350)
  }

  if (!alert) return null

  const sev     = (alert.severity || 'high').toLowerCase()
  const sevColor = sev === 'critical' ? 'var(--red)' : sev === 'high' ? 'var(--orange)' : sev === 'medium' ? 'var(--yellow)' : 'var(--green)'
  const sevDim   = sev === 'critical' ? 'var(--red-dim)' : sev === 'high' ? 'var(--orange-dim)' : sev === 'medium' ? 'var(--yellow-dim)' : 'var(--green-dim)'
  const sevBorder= sev === 'critical' ? 'var(--red-border)' : sev === 'high' ? 'var(--orange-border)' : sev === 'medium' ? 'var(--yellow-border)' : 'var(--green-border)'
  const badgeCls = `badge badge-${sev === 'critical' ? 'critical' : sev === 'high' ? 'high' : sev === 'medium' ? 'medium' : 'low'}`

  const aiText  = (alert.ai_response || '').slice(0, aiTextIdx)
  const isTyping = aiTextIdx < (alert.ai_response || '').length

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: visible ? 'translate(-50%,-50%) scale(1)' : 'translate(-50%,-50%) scale(0.93)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease',
        zIndex: 9999,
        width: 'min(760px, 94vw)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: `3px solid ${sevColor}`,
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px',
          background: sevDim,
          borderBottom: `1px solid ${sevBorder}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: sevColor, display: 'block', flexShrink: 0,
              animation: 'pulseDot 0.9s ease-in-out infinite alternate',
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: sevColor, textTransform: 'uppercase' }}>
              ⚡ CyberNova AI — Live Threat Detected
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {alert.mitre_id && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                color: 'var(--text-2)', background: 'var(--surface-2)',
                border: '1px solid var(--border)', padding: '2px 8px',
                borderRadius: 4, fontFamily: "'JetBrains Mono', monospace",
              }}>
                MITRE {alert.mitre_id}
              </span>
            )}
            <button
              onClick={dismiss}
              style={{
                width: 28, height: 28, borderRadius: 'var(--r-sm)',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text-3)', cursor: 'pointer', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span style={{
              fontSize: 28, lineHeight: 1, flexShrink: 0,
              width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: sevDim, border: `1px solid ${sevBorder}`,
              borderRadius: 'var(--r-sm)',
            }}>{alert.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 6 }}>
                {alert.attack_name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  Target: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{alert.affected_username}</span>
                </span>
                <span style={{ color: 'var(--border)', fontSize: 12 }}>·</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  IP: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: sevColor, fontSize: 11 }}>{alert.affected_ip}</span>
                </span>
                <span style={{ color: 'var(--border)', fontSize: 12 }}>·</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  Risk: <span style={{ color: sevColor, fontWeight: 700 }}>{alert.risk_score}/100</span>
                </span>
                <span className={badgeCls}>{(alert.severity || 'HIGH').toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* Attacker */}
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderLeft: `3px solid var(--red)`,
              borderRadius: 'var(--r-sm)', padding: '14px 16px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--red)', marginBottom: 8, textTransform: 'uppercase' }}>
                🔴 What the Attacker is Doing
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                {alert.attack_explanation}
              </p>
            </div>

            {/* AI response */}
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderLeft: `3px solid var(--blue-light)`,
              borderRadius: 'var(--r-sm)', padding: '14px 16px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--blue-light)', marginBottom: 8, textTransform: 'uppercase' }}>
                🤖 What CyberNova AI is Doing
              </div>
              <p style={{
                fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, margin: 0,
                fontFamily: isTyping ? "'JetBrains Mono', monospace" : 'inherit',
              }}>
                {aiText}
                {isTyping && (
                  <span style={{
                    display: 'inline-block', width: 2, height: 13,
                    background: 'var(--blue-light)', marginLeft: 2,
                    verticalAlign: 'middle', animation: 'pulseDot 0.5s infinite alternate',
                  }} />
                )}
              </p>
            </div>
          </div>

          {/* SOAR actions */}
          {alert.response_taken?.length > 0 && (
            <div style={{
              background: 'var(--green-dim)', border: '1px solid var(--green-border)',
              borderRadius: 'var(--r-sm)', padding: '10px 14px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--green)', marginBottom: 8, textTransform: 'uppercase' }}>
                ⚡ SOAR Auto-Containment Actions Executed
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {alert.response_taken.map((action, i) => {
                  const label = typeof action === 'string'
                    ? action
                    : (action.policy_name || action.action_type || action.action || 'Containment Action')
                  return (
                    <span key={i} style={{
                      fontSize: 11, fontWeight: 600,
                      background: 'var(--green-dim)', border: '1px solid var(--green-border)',
                      color: 'var(--green)', padding: '3px 9px',
                      borderRadius: 4, display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span style={{ fontSize: 10 }}>✓</span> {label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 2 }}>
            <button onClick={dismiss} className="btn btn-ghost btn-sm">
              Dismiss
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { dismiss(); navigate(`/soc/incidents/${alert.incident_id}`) }}
            >
              View Full Incident Report →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
