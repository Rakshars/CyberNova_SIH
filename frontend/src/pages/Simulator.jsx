import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { simulateEvent, triggerSimulatedAttack, getUsers } from '../api'
import { Terminal, Send, Zap, AlertTriangle, CheckCircle2, ChevronRight, User, RefreshCw, Crosshair } from 'lucide-react'
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

// Preset Attack Scenarios for Custom Payload Builder
const SCENARIO_PRESETS = [
  { id: 'custom_brute', label: '💥 Brute Force Burst (Tor Exit Node)', username: 'meera', ip: '185.220.194.14', country: 'North Korea', device: 'Tor Exit Node', status: 'failed', event_type: 'auth' },
  { id: 'custom_upi', label: '💳 Bharat UPI Drain (Moscow Proxy)', username: 'vikram', ip: '45.33.32.156', country: 'Russia', device: 'Python Script / Requests', status: 'failed', event_type: 'upi' },
  { id: 'custom_phish', label: '📱 SMS Phishing Blast (Delhi Proxy)', username: 'priya', ip: '14.139.60.10', country: 'India', device: 'Mobile Safari / iOS', status: 'failed', event_type: 'phishing' },
  { id: 'custom_deepfake', label: '🎭 CEO Deepfake Wire (Frankfurt Proxy)', username: 'arjun', ip: '192.168.1.104', country: 'Germany', device: 'CyberNova Voice Synthesizer', status: 'failed', event_type: 'wire' },
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
  const [usersList, setUsersList]       = useState([])
  const [stagedCmd, setStagedCmd]       = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const terminalInputRef = useRef(null)

  const [logs, setLogs] = useState([
    { t: 'INIT',  msg: 'Red Team C2 environment ready.', type: 'info' },
    { t: 'INFO',  msg: 'Monitored subnet: 192.168.1.0/24', type: 'info' },
    { t: 'READY', msg: 'Awaiting operator command.', type: 'info' },
  ])
  const [form, setForm] = useState({
    username: 'meera', ip_address: '185.220.194.14',
    country: 'North Korea', device: 'Tor Exit Node',
    browser: 'curl/7.68.0', login_status: 'failed', event_type: 'auth',
  })

  // Fetch Live System Users on mount
  useEffect(() => {
    getUsers()
      .then(users => {
        if (users && users.length > 0) {
          setUsersList(users)
          addLog(`Loaded ${users.length} live target user profiles from system DB.`, 'info')
        }
      })
      .catch(() => {})
  }, [])

  const addLog = (msg, type = 'info') => {
    const t = new Date().toLocaleTimeString('en-GB', { hour12: false })
    setLogs(prev => [...prev, { t, msg, type }].slice(-14))
  }

  const buildInjectCmd = (f) => {
    const cleanDev = (f.device || 'Device').replace(/\s+/g, '_')
    const cleanGeo = (f.country || 'Unknown').replace(/\s+/g, '_')
    return `python3 ./exploit_injector.py --target=${f.username} --ip=${f.ip_address} --geo=${cleanGeo} --device=${cleanDev} --status=${f.login_status}`
  }

  const buildVectorCmd = (id, target) => {
    return `python3 ./redteam_c2.py --vector=${id.toUpperCase()} --target=${target} --subnet=192.168.1.0/24 --mode=EXPLOIT`
  }

  const handleSelectUser = (username) => {
    const found = usersList.find(u => u.username === username)
    if (found) {
      const updatedForm = {
        ...form,
        username: found.username,
        country: found.baseline_country || form.country,
        device: found.baseline_device || form.device
      }
      setForm(updatedForm)
      addLog(`Target locked → Live User: ${found.username} (${found.department || 'User'})`, 'warn')
      
      // Stage command in terminal prompt automatically
      const cmd = buildInjectCmd(updatedForm)
      setStagedCmd(cmd)
      setPendingAction({ type: 'inject', payload: updatedForm })
      setTimeout(() => { if (terminalInputRef.current) terminalInputRef.current.focus() }, 50)
    }
  }

  const handleApplyPreset = (preset) => {
    const updatedForm = {
      ...form,
      username: preset.username,
      ip_address: preset.ip,
      country: preset.country,
      device: preset.device,
      login_status: preset.status,
      event_type: preset.event_type,
    }
    setForm(updatedForm)
    addLog(`Loaded scenario → ${preset.label}`, 'warn')

    // Stage command in terminal prompt automatically
    const cmd = buildInjectCmd(updatedForm)
    setStagedCmd(cmd)
    setPendingAction({ type: 'inject', payload: updatedForm })
    addLog(`[SYS] Command staged for execution. Press ENTER to launch!`, 'info')
    setTimeout(() => { if (terminalInputRef.current) terminalInputRef.current.focus() }, 50)
  }

  // Stage Vector attack command when Vector card is clicked
  const handleStageVector = (id) => {
    const targetUser = form.username || 'meera'
    const cmd = buildVectorCmd(id, targetUser)
    setStagedCmd(cmd)
    setPendingAction({ type: 'vector', id: id, target: targetUser })
    addLog(`[SYS] Staged vector: ${cmd}`, 'warn')
    addLog(`[SYS] Press ENTER key in terminal to launch attack!`, 'info')
    setTimeout(() => { if (terminalInputRef.current) terminalInputRef.current.focus() }, 50)
  }

  // Stage Custom Payload when EXECUTE PAYLOAD INJECTION button is clicked
  const handleStageInject = (e) => {
    if (e) e.preventDefault()
    if (pendingAction && stagedCmd) {
      // If already staged, execute directly!
      executeStagedCommand()
      return
    }
    const cmd = buildInjectCmd(form)
    setStagedCmd(cmd)
    setPendingAction({ type: 'inject', payload: { ...form } })
    addLog(`[SYS] Staged custom payload command: ${cmd}`, 'warn')
    addLog(`[SYS] Press ENTER key in terminal to execute payload!`, 'info')
    setTimeout(() => { if (terminalInputRef.current) terminalInputRef.current.focus() }, 50)
  }

  // Execute the staged command when ENTER key is pressed
  const executeStagedCommand = async () => {
    if (loading) return
    const cmdToRun = stagedCmd.trim() || buildInjectCmd(form)
    const actionToRun = pendingAction

    setStagedCmd('')
    setPendingAction(null)

    // Echo CLI execution line into local Red Team terminal logs
    addLog(`root@red-team:~# ${cmdToRun}`, 'info')

    // Save to history array & latest storage
    const cliDetail = { cmd: cmdToRun, ts: Date.now() }
    try {
      const history = JSON.parse(localStorage.getItem('cybernova_cli_history') || '[]')
      history.push(cliDetail)
      localStorage.setItem('cybernova_cli_history', JSON.stringify(history.slice(-20)))
      localStorage.setItem('cybernova_cli_latest', JSON.stringify(cliDetail))
      sessionStorage.setItem('cybernova_cli_latest', JSON.stringify(cliDetail))
    } catch(e){}

    // Broadcast CLI command to Main Dashboard Live Stream terminal
    window.dispatchEvent(new CustomEvent('cybernova_cli_command', { detail: cliDetail }))
    try {
      const channel = new BroadcastChannel('cybernova_soc_feed')
      channel.postMessage({ type: 'cybernova_cli_command', detail: cliDetail })
      channel.close()
    } catch(e){}

    if (actionToRun?.type === 'vector') {
      await runVectorExecution(actionToRun.id, cmdToRun)
    } else if (actionToRun?.type === 'inject') {
      await runInjectExecution(actionToRun.payload || form, cmdToRun)
    } else {
      // Freeform typed CLI command (e.g. "hi, hello")
      addLog(`[C2] Command dispatched to red team agents: ${cmdToRun}`, 'warn')
    }
  }

  const runVectorExecution = async (id, cliCmd) => {
    setActiveVector(id); setLoading(true)
    addLog(`[ATK] Deploying vector: ${id.toUpperCase()}`, 'warn')
    try {
      const res = await triggerSimulatedAttack(id)
      const attackPayload = {
        attack_type: res.attack_type,
        target_user: res.target_user,
        attacker_ip: res.attacker_ip,
        incident: res.incident_summary,
        actions: res.soar_autonomous_actions,
        cliCommand: cliCmd
      }
      
      const eventData = { ...attackPayload, ts: Date.now() }
      window.dispatchEvent(new CustomEvent('cybernova_attack_trace', { detail: eventData }))
      try {
        sessionStorage.setItem('cybernova_latest_attack', JSON.stringify(eventData))
        localStorage.setItem('cybernova_latest_attack', JSON.stringify(eventData))
      } catch(e){}
      try {
        const channel = new BroadcastChannel('cybernova_soc_feed')
        channel.postMessage({ type: 'cybernova_attack_trace', detail: eventData })
        channel.close()
      } catch(e){}

      addLog(`[OK] Payload delivered → target: ${res.target_user}`, 'success')
    } catch (err) {
      addLog(`Injection failed: ${err.message}`, 'error')
    } finally {
      setLoading(false)
      setActiveVector(null)
    }
  }

  const runInjectExecution = async (payloadData, cliCmd) => {
    setLoading(true); setResult(null)
    addLog(`[ATK] Injecting event for '${payloadData.username}' from ${payloadData.ip_address}`, 'warn')
    try {
      const res = await simulateEvent({ ...payloadData, timestamp: new Date().toISOString() })
      setResult(res)

      const isAnomaly = res.is_anomaly || (res.risk_score && res.risk_score >= 30)
      addLog(isAnomaly
        ? `[OK] ANOMALY FLAGGED — score ${res.risk_score}/100 — incident created`
        : `[OK] Telemetry ingested — score ${res.risk_score}/100 — no anomaly`,
        isAnomaly ? 'error' : 'success')

      const telemetryDetail = { ...res, timestamp: Date.now() }
      window.dispatchEvent(new CustomEvent('cybernova_telemetry_event', { detail: telemetryDetail }))
      try {
        const channel = new BroadcastChannel('cybernova_soc_feed')
        channel.postMessage({ type: 'cybernova_telemetry_event', detail: telemetryDetail })
        channel.close()
      } catch(e){}

      if (isAnomaly || res.incident_id) {
        const customTracePayload = {
          target_user: res.username || payloadData.username,
          attacker_ip: res.ip_address || payloadData.ip_address,
          cliCommand: cliCmd,
          incident: {
            title: `Custom Telemetry Payload: ${payloadData.login_status} auth from ${payloadData.country}`,
            id: res.incident_id || 'INC-CUSTOM-PAYLOAD',
            risk_score: res.risk_score || 85
          },
          actions: [
            { action_type: 'BLOCK_IP', target: res.ip_address || payloadData.ip_address },
            { action_type: 'QUARANTINE_USER', target: res.username || payloadData.username },
            { action_type: 'ALERT_SOC', target: 'SOC Channel' }
          ],
          ts: Date.now()
        }
        window.dispatchEvent(new CustomEvent('cybernova_attack_trace', { detail: customTracePayload }))
        try {
          sessionStorage.setItem('cybernova_latest_attack', JSON.stringify(customTracePayload))
          localStorage.setItem('cybernova_latest_attack', JSON.stringify(customTracePayload))
        } catch(e){}
        try {
          const channel = new BroadcastChannel('cybernova_soc_feed')
          channel.postMessage({ type: 'cybernova_attack_trace', detail: customTracePayload })
          channel.close()
        } catch(e){}
      }
    } catch (err) {
      addLog(`Payload error: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
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
            const isStaged = pendingAction?.type === 'vector' && pendingAction?.id === atk.id
            return (
              <button
                key={atk.id}
                onClick={() => handleStageVector(atk.id)}
                disabled={loading}
                style={{
                  background: isActive ? rc.dim : (isStaged ? C.accentDim : 'rgba(255,255,255,0.02)'),
                  border: `1px solid ${isActive ? rc.color : (isStaged ? C.accent : 'rgba(255,255,255,0.07)')}`,
                  borderRadius: 8, padding: '14px 16px', textAlign: 'left',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading && !isActive ? 0.4 : 1,
                  transition: 'all 0.15s ease',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = rc.dim; e.currentTarget.style.borderColor = rc.border } }}
                onMouseLeave={e => { if (!loading && !isStaged) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' } }}
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
                  <span style={{ fontSize: 10, color: isStaged ? C.accent : rc.color, fontWeight: isStaged ? 700 : 400, display: 'flex', alignItems: 'center', gap: 3 }}>
                    {isActive ? 'Deploying…' : (isStaged ? '⚡ STAGED (Press ENTER)' : <><ChevronRight size={11} />Stage Payload</>)}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={14} color={C.accent} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textSub, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Custom Attack & Telemetry Payload Crafting
              </span>
            </div>
            {usersList.length > 0 && (
              <span className="badge badge-low" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={10} /> {usersList.length} Live DB Targets
              </span>
            )}
          </div>

          {/* Quick Scenario & Live Target Selectors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
                ⚡ Quick Load Attack Scenario
              </label>
              <select
                onChange={e => {
                  const found = SCENARIO_PRESETS.find(s => s.id === e.target.value)
                  if (found) handleApplyPreset(found)
                }}
                defaultValue=""
                style={{ ...inputStyle, background: '#0a0b0e', borderColor: C.accentBorder }}
              >
                <option value="" disabled>-- Select Pre-Crafted Threat Scenario --</option>
                {SCENARIO_PRESETS.map(sc => (
                  <option key={sc.id} value={sc.id}>{sc.label}</option>
                ))}
              </select>
            </div>

            {usersList.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
                  🎯 Lock Target onto Live Registered System User
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    value={form.username}
                    onChange={e => handleSelectUser(e.target.value)}
                    style={{ ...inputStyle, background: '#0a0b0e', flex: 1 }}
                  >
                    {usersList.map(u => (
                      <option key={u.id || u.username} value={u.username}>
                        {u.username} ({u.department || 'User'} · {u.baseline_country || 'Global'} · Risk: {u.risk_score || 0})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    title="Lock onto Random Target User"
                    onClick={() => {
                      const randomUser = usersList[Math.floor(Math.random() * usersList.length)]
                      if (randomUser) handleSelectUser(randomUser.username)
                    }}
                    style={{
                      background: C.accentDim, border: `1px solid ${C.accentBorder}`,
                      color: C.accent, borderRadius: 6, padding: '0 10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <Crosshair size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleStageInject} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'username',   label: 'Target Username' },
              { name: 'ip_address', label: 'Source IP' },
              { name: 'country',    label: 'Geolocation' },
              { name: 'device',     label: 'User Agent / Device' },
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
                Threat Condition & Login Status
              </label>
              <select
                name="login_status" value={form.login_status}
                onChange={e => setForm(p => ({ ...p, login_status: e.target.value }))}
                style={{ ...inputStyle, background: '#0a0b0e' }}
              >
                <option value="failed">failed — high-risk anomaly trigger (brute force burst)</option>
                <option value="failed_tor">failed — Tor exit node & impossible travel jump</option>
                <option value="failed_malware">failed — suspicious NLP malware payload exfiltration</option>
                <option value="success">success — normal authenticated baseline</option>
              </select>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                marginTop: 4, padding: '10px 16px', borderRadius: 6,
                background: loading ? C.accentDim : (stagedCmd ? C.accent : C.accentSolid),
                border: `1px solid ${C.accentBorder}`,
                color: '#fff', fontWeight: 700, fontSize: 12,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em',
                transition: 'all 0.15s ease',
              }}
            >
              <Send size={13} />
              {loading ? 'INJECTING…' : (stagedCmd ? '⏎ PRESS ENTER TO EXECUTE PAYLOAD' : 'STAGE & EXECUTE PAYLOAD INJECTION')}
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
                <span><span style={{ opacity: 0.55 }}>[ATK] </span>executing payload via Red Team C2 CLI…</span>
              </div>
            )}
          </div>

          {/* Interactive Prompt */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              executeStagedCommand()
            }}
            style={{
              padding: '10px 14px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: stagedCmd ? 'rgba(232,108,42,0.08)' : 'rgba(0,0,0,0.40)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ color: C.accent, fontWeight: 700, whiteSpace: 'nowrap' }}>root@red-team</span>
            <span style={{ color: C.textSub, whiteSpace: 'nowrap' }}>:~#</span>
            <input
              ref={terminalInputRef}
              value={stagedCmd}
              onChange={e => setStagedCmd(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  executeStagedCommand()
                }
              }}
              placeholder={pendingAction ? "Press ENTER to execute payload..." : "Select attack or craft payload..."}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: stagedCmd ? C.accent : C.text,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, fontWeight: stagedCmd ? 600 : 400
              }}
            />
            {stagedCmd ? (
              <button
                type="submit"
                style={{
                  background: C.accentSolid, border: 'none', borderRadius: 4,
                  color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px',
                  cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                  display: 'flex', alignItems: 'center', gap: 5,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 0 10px rgba(232,108,42,0.4)'
                }}
              >
                <Send size={10} /> ⏎ Press ENTER
              </button>
            ) : (
              <span style={{
                display: 'inline-block', width: 7, height: 13,
                background: C.accent, marginLeft: 2, opacity: 0.8
              }} />
            )}
          </form>
        </div>

      </div>

    </div>
  )
}
