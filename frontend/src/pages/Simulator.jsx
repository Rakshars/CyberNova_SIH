import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { simulateEvent, triggerSimulatedAttack } from '../api'
import { Terminal, Send, Zap, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import NetworkAttackModal from '../components/NetworkAttackModal'

const ATTACK_VECTORS = [
  {
    id: 'brute_force',
    label: 'Brute Force + Impossible Travel',
    desc: 'Rapid credential burst from rotating proxies followed by geolocation jump across continents within seconds.',
    mitre: 'T1110.003 · T1078',
    risk: 'CRITICAL',
  },
  {
    id: 'upi_fraud',
    label: 'Bharat UPI Micro-Debit Drain',
    desc: 'High-velocity automated micro-transactions across multiple VPAs to evade per-transaction fraud thresholds.',
    mitre: 'T1657 · T1496',
    risk: 'HIGH',
  },
  {
    id: 'phishing_blast',
    label: 'SMS Scam Blast Campaign',
    desc: 'Bulk NLP-crafted phishing messages impersonating electricity boards and banks to harvest KYC credentials.',
    mitre: 'T1566.004 · T1598',
    risk: 'HIGH',
  },
  {
    id: 'deepfake_wire',
    label: 'Deepfake CEO Wire Fraud',
    desc: 'Synthetic voice/video impersonation of executive to authorize fraudulent wire transfer to mule account.',
    mitre: 'T1656 · T1036',
    risk: 'CRITICAL',
  },
]

// Amber palette — matches AttackerLayout
const C = {
  accent:       '#e86c2a',
  accentDim:    'rgba(232,108,42,0.10)',
  accentBorder: 'rgba(232,108,42,0.28)',
  accentSolid:  '#c45a1a',
  gold:         '#c9a227',
  goldDim:      'rgba(201,162,39,0.10)',
  goldBorder:   'rgba(201,162,39,0.28)',
  green:        '#4ade80',
  greenDim:     'rgba(74,222,128,0.08)',
  greenBorder:  'rgba(74,222,128,0.25)',
  surface:      'rgba(13,14,18,0.95)',
  surfaceBorder:'rgba(232,108,42,0.14)',
  text:         '#d4d8e0',
  textSub:      'rgba(255,255,255,0.40)',
  textMuted:    'rgba(255,255,255,0.22)',
}

const RISK = {
  CRITICAL: { color: C.accent, dim: C.accentDim, border: C.accentBorder },
  HIGH:     { color: C.gold,   dim: C.goldDim,   border: C.goldBorder   },
}

export default function Simulator() {
  const navigate = useNavigate()
  const [loading, setLoading]           = useState(false)
  const [activeVector, setActiveVector] = useState(null)
  const [result, setResult]             = useState(null)
  const [attackInfoModal, setAttackInfoModal] = useState(null)
  const [logs, setLogs] = useState([
    { t: 'INIT',  msg: 'Red Team C2 environment ready.', type: 'info' },
    { t: 'INFO',  msg: 'Monitored subnet: 192.168.1.0/24', type: 'info' },
    { t: 'READY', msg: 'Awaiting operator command.', type: 'info' },
  ])
  const [form, setForm] = useState({
    username: 'admin', ip_address: '103.45.67.89',
    country: 'North Korea', device: 'Unknown Device',
    browser: 'curl/7.68.0', login_status: 'failed', event_type: 'auth',
  })

  const addLog = (msg, type = 'info') => {
    const t = new Date().toLocaleTimeString('en-GB', { hour12: false })
    setLogs(prev => [...prev, { t, msg, type }].slice(-12))
  }

  const handleLaunchVector = async (id) => {
    setActiveVector(id); setLoading(true)
    addLog(`Deploying vector: ${id.toUpperCase()}`, 'warn')
    try {
      const res = await triggerSimulatedAttack(id)
      if (res?.details) {
        setAttackInfoModal(res.details)
        addLog(`Payload delivered → target: ${res.details.target_user}`, 'success')
      }
    } catch (err) { addLog(`Injection failed: ${err.message}`, 'error') }
    finally { setLoading(false); setActiveVector(null) }
  }

  const handleInject = async (e) => {
    e.preventDefault(); setLoading(true); setResult(null)
    addLog(`Injecting event for '${form.username}' from ${form.ip_address}`, 'warn')
    try {
      const res = await simulateEvent({ ...form, timestamp: new Date().toISOString() })
      setResult(res)
      addLog(res.is_anomaly
        ? `ANOMALY FLAGGED — score ${res.risk_score}/100 — incident created`
        : `Telemetry ingested — score ${res.risk_score}/100 — no anomaly`,
        res.is_anomaly ? 'error' : 'success')
    } catch (err) { addLog(`Payload error: ${err.message}`, 'error') }
    finally { setLoading(false) }
  }

  const logColor  = t => ({ error: C.accent, warn: C.gold, success: C.green }[t] || C.textSub)
  const logPrefix = t => ({ error: '[ERR] ', warn: '[ATK] ', success: '[OK]  ' }[t] || '[SYS] ')

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${C.accentBorder}`, borderRadius: 6,
    padding: '8px 10px', color: C.text, fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace", outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {attackInfoModal && (
        <NetworkAttackModal attackInfo={attackInfoModal} onClose={() => setAttackInfoModal(null)} />
      )}

      {/* Header */}
      <div>
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
            color: C.accent, border: `1px solid ${C.accentBorder}`,
            background: C.accentDim, padding: '3px 9px', borderRadius: 4,
            fontFamily: "'JetBrains Mono', monospace",
          }}>OFFENSIVE · ADVERSARY EMULATOR</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', marginBottom: 4 }}>
          Red Team Payload Injector
        </h1>
        <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.5 }}>
          Deploy pre-configured attack vectors or craft custom telemetry payloads against the CyberNova AI SOC.
        </p>
      </div>

      {/* Attack Vectors */}
      <div style={{ background: C.surface, border: `1px solid ${C.surfaceBorder}`, borderRadius: 10, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Zap size={14} color={C.accent} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textSub, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Pre-Configured Attack Vectors
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {ATTACK_VECTORS.map(atk => {
            const rc = RISK[atk.risk]
            const isActive = activeVector === atk.id && loading
            return (
              <button
                key={atk.id}
                onClick={() => handleLaunchVector(atk.id)}
                disabled={loading}
                style={{
                  background: isActive ? rc.dim : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive ? rc.color : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 8, padding: '14px 16px', textAlign: 'left',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading && !isActive ? 0.4 : 1,
                  transition: 'all 0.15s ease',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = rc.dim; e.currentTarget.style.borderColor = rc.border } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{atk.label}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
                    color: rc.color, border: `1px solid ${rc.border}`,
                    background: rc.dim, padding: '2px 6px', borderRadius: 3,
                    whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace",
                  }}>{atk.risk}</span>
                </div>
                <p style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>{atk.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{atk.mitre}</span>
                  <span style={{ fontSize: 10, color: rc.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                    {isActive ? 'Deploying…' : <><ChevronRight size={11} />Launch</>}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Form + Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Form */}
        <div style={{ background: C.surface, border: `1px solid ${C.surfaceBorder}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Terminal size={14} color={C.accent} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textSub, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Custom Telemetry Payload
            </span>
          </div>

          <form onSubmit={handleInject} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'username',   label: 'Target Username' },
              { name: 'ip_address', label: 'Source IP' },
              { name: 'country',    label: 'Geolocation' },
              { name: 'device',     label: 'User Agent' },
            ].map(({ name, label }) => (
              <div key={name}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>
                  {label}
                </label>
                <input
                  name={name} value={form[name]}
                  onChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.accentBorder}
                />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>
                Login Status
              </label>
              <select
                name="login_status" value={form.login_status}
                onChange={e => setForm(p => ({ ...p, login_status: e.target.value }))}
                style={{ ...inputStyle, background: '#0a0b0e' }}
              >
                <option value="failed">failed — brute force burst</option>
                <option value="success">success — authenticated</option>
              </select>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                marginTop: 4, padding: '10px 16px', borderRadius: 6,
                background: loading ? C.accentDim : C.accentSolid,
                border: `1px solid ${C.accentBorder}`,
                color: '#fff', fontWeight: 700, fontSize: 12,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em',
                transition: 'all 0.15s ease',
              }}
            >
              <Send size={13} />
              {loading ? 'INJECTING…' : 'EXECUTE PAYLOAD INJECTION'}
            </button>
          </form>

          {result && (
            <div style={{
              marginTop: 14, padding: '12px 14px', borderRadius: 7,
              background: result.is_anomaly ? C.accentDim : C.greenDim,
              border: `1px solid ${result.is_anomaly ? C.accentBorder : C.greenBorder}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                {result.is_anomaly
                  ? <AlertTriangle size={14} color={C.accent} />
                  : <CheckCircle2 size={14} color={C.green} />}
                <span style={{ fontSize: 12, fontWeight: 700, color: result.is_anomaly ? C.accent : C.green, fontFamily: "'JetBrains Mono', monospace" }}>
                  {result.is_anomaly ? 'ANOMALY DETECTED' : 'NORMAL TELEMETRY'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textSub, marginBottom: result.incident_id ? 10 : 0 }}>
                <span>Risk Score</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: result.is_anomaly ? C.accent : C.green, fontWeight: 700 }}>
                  {result.risk_score} / 100 · {result.risk_level}
                </span>
              </div>
              {result.incident_id && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/soc/incidents/${result.incident_id}`)}
                  style={{ width: '100%', marginTop: 4, fontSize: 11 }}
                >
                  View Incident {result.incident_id} in SOC →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Terminal */}
        <div style={{
          background: '#0a0b0e',
          border: `1px solid ${C.surfaceBorder}`,
          borderRadius: 10, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Titlebar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display: 'flex', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.accent,  display: 'block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.gold,    display: 'block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.green,   display: 'block' }} />
            </div>
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", marginLeft: 4 }}>
              /var/log/redteam_c2.log
            </span>
          </div>

          {/* Logs */}
          <div style={{
            flex: 1, padding: '14px 16px',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex', flexDirection: 'column', gap: 5,
            overflowY: 'auto', minHeight: 260,
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{ fontSize: 11, lineHeight: 1.7, display: 'flex', gap: 10 }}>
                <span style={{ color: C.textMuted, flexShrink: 0 }}>{log.t}</span>
                <span style={{ color: logColor(log.type) }}>
                  <span style={{ opacity: 0.55 }}>{logPrefix(log.type)}</span>
                  {log.msg}
                </span>
              </div>
            ))}
            {loading && (
              <div style={{ fontSize: 11, color: C.gold, display: 'flex', gap: 10 }}>
                <span style={{ color: C.textMuted }}>{new Date().toLocaleTimeString('en-GB', { hour12: false })}</span>
                <span><span style={{ opacity: 0.55 }}>[ATK] </span>executing…</span>
              </div>
            )}
          </div>

          {/* Prompt */}
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, color: C.textMuted,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ color: C.accent }}>root@red-team</span>
            <span>:~#</span>
            <span style={{
              display: 'inline-block', width: 7, height: 13,
              background: C.accentDim, border: `1px solid ${C.accentBorder}`,
              marginLeft: 2, animation: 'pulseDot 1s infinite',
            }} />
          </div>
        </div>

      </div>
    </div>
  )
}
