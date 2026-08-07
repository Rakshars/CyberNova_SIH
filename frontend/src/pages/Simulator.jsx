import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { simulateEvent, triggerSimulatedAttack } from '../api'
import { Terminal, Send, ShieldAlert, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react'
import NetworkAttackModal from '../components/NetworkAttackModal'

export default function Simulator() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [attackInfoModal, setAttackInfoModal] = useState(null)
  const [terminalLogs, setTerminalLogs] = useState([
    '[SYSTEM] Red Team C2 Environment Ready.',
    '[INFO] Monitored LAN Subnet: 192.168.1.0/24',
    '[READY] Select custom telemetry payload or trigger attack scenario.'
  ])

  // Default values for custom event injection
  const [formData, setFormData] = useState({
    username: 'admin',
    ip_address: '103.45.67.89',
    country: 'North Korea',
    device: 'Unknown Device',
    browser: 'curl/7.68.0',
    login_status: 'failed',
    event_type: 'auth'
  })

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const addLog = (msg) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-8))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    addLog(`Injecting custom security event for user '${formData.username}'...`)
    
    try {
      const payload = {
        ...formData,
        timestamp: new Date().toISOString()
      }
      const res = await simulateEvent(payload)
      setResult(res)
      if (res.is_anomaly) {
        addLog(`⚠️ ANOMALY DETECTED: Risk Score ${res.risk_score}/100. Incident Created!`)
      } else {
        addLog(`✅ Normal Telemetry Ingested into SOC. Score ${res.risk_score}/100`)
      }
    } catch (err) {
      addLog(`❌ Payload Injection Failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLaunchPresetAttack = async (scenarioType) => {
    setLoading(true)
    addLog(`Deploying ${scenarioType.toUpperCase()} Attack Vector Playbook...`)
    try {
      const res = await triggerSimulatedAttack(scenarioType)
      if (res && res.details) {
        setAttackInfoModal(res.details)
        addLog(`🚀 Attack Injected: ${res.details.title} (Target: ${res.details.target_user})`)
      }
    } catch (err) {
      addLog(`❌ Scenario Injection Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
      
      {/* Network Attack Mesh Visualizer Modal */}
      {attackInfoModal && (
        <NetworkAttackModal
          attackInfo={attackInfoModal}
          onClose={() => setAttackInfoModal(null)}
        />
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: 'var(--critical-bg)',
            color: 'var(--critical)',
            border: '1px solid var(--critical)',
            padding: '3px 10px',
            borderRadius: '99px',
            fontSize: '11px',
            fontWeight: 800
          }}>
            OFFENSIVE ADVERSARY EMULATOR
          </span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
          Red Team Security Payload Injector
        </h1>
        <p style={{ color: 'var(--text-sub)', fontSize: '13px' }}>
          Inject custom telemetry packets or trigger real-world multi-stage cyber attacks against the CyberNova AI SOC.
        </p>
      </div>

      {/* Preset Scenario Attack Launchers */}
      <div style={{
        background: 'rgba(15, 0, 5, 0.8)',
        border: '1px solid rgba(255, 42, 109, 0.35)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 10px 30px rgba(255, 42, 109, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <ShieldAlert size={18} color="#ff2a6d" />
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
            Pre-Configured Red Team Attack Vectors
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          {[
            { id: 'brute_force', label: '💥 Brute Force + Travel', desc: 'Credential stuffing & impossible travel burst', color: '#ff2a6d' },
            { id: 'upi_fraud', label: '💳 Bharat UPI Micro-Debit', desc: 'High-velocity automated UPI VPA drain', color: '#ffaa00' },
            { id: 'phishing_blast', label: '📱 SMS Scam Blast', desc: 'NLP malicious extortion & link campaign', color: '#00f2fe' },
            { id: 'deepfake_wire', label: '🎭 Deepfake CEO Fraud', desc: 'Voice/video impersonation payload', color: '#05ffa1' }
          ].map(atk => (
            <button
              key={atk.id}
              onClick={() => handleLaunchPresetAttack(atk.id)}
              disabled={loading}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${atk.color}44`,
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${atk.color}15`
                e.currentTarget.style.borderColor = atk.color
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 0 20px ${atk.color}33`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                e.currentTarget.style.borderColor = `${atk.color}44`
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{atk.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{atk.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Custom Payload Form + Output Console */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Custom Payload Form */}
        <div style={{
          background: 'rgba(15, 0, 5, 0.8)',
          border: '1px solid rgba(255, 42, 109, 0.25)',
          borderRadius: '16px',
          padding: '22px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Terminal size={18} color="#ff2a6d" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Custom Telemetry Ingest Form</h3>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '6px' }}>Target Username</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 42, 109, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '6px' }}>Source IP</label>
                <input
                  name="ip_address"
                  value={formData.ip_address}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 42, 109, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '6px' }}>Geolocation Country</label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 42, 109, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '6px' }}>User Agent / Device</label>
                <input
                  name="device"
                  value={formData.device}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 42, 109, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '6px' }}>Login Status</label>
                <select
                  name="login_status"
                  value={formData.login_status}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    background: '#0d0205',
                    border: '1px solid rgba(255, 42, 109, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '13px'
                  }}
                >
                  <option value="failed">Failed Login (Burst)</option>
                  <option value="success">Success Login</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff2a6d 0%, #990022 100%)',
                border: 'none',
                color: '#fff',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(255, 42, 109, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Send size={16} />
              {loading ? 'INJECTING PACKET...' : 'EXECUTE PAYLOAD INJECTION'}
            </button>
          </form>
        </div>

        {/* Console Log Stream & Result Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Terminal Console Output */}
          <div style={{
            flex: 1,
            background: 'rgba(10, 0, 4, 0.95)',
            border: '1px solid rgba(255, 42, 109, 0.3)',
            borderRadius: '16px',
            padding: '18px',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#ff2a6d', fontSize: '12px', fontWeight: 'bold' }}>
              <Cpu size={14} />
              <span>/var/log/redteam_payload_stream.log</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {terminalLogs.map((log, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: log.includes('⚠️') ? '#ffaa00' : (log.includes('❌') ? '#ff2a6d' : 'rgba(255,255,255,0.7)'), lineHeight: '1.6' }}>
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Anomaly Evaluation Result Card */}
          {result && (
            <div style={{
              background: 'rgba(15, 0, 5, 0.95)',
              border: `1px solid ${result.is_anomaly ? 'var(--critical)' : 'var(--low)'}`,
              borderRadius: '16px',
              padding: '18px',
              boxShadow: `0 0 25px ${result.is_anomaly ? 'rgba(255,42,109,0.25)' : 'rgba(5,255,161,0.25)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                {result.is_anomaly ? <AlertTriangle color="var(--critical)" size={18} /> : <CheckCircle2 color="var(--low)" size={18} />}
                <span style={{ fontSize: '14px', fontWeight: 800, color: result.is_anomaly ? 'var(--critical)' : 'var(--low)' }}>
                  {result.is_anomaly ? '⚠️ ML ANOMALY DETECTED BY CYBERNOVA' : '✅ NORMAL TELEMETRY RECORDED'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-sub)' }}>Explainable AI Risk Score:</span>
                <strong style={{ color: result.is_anomaly ? 'var(--critical)' : 'var(--low)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {result.risk_score} / 100 ({result.risk_level})
                </strong>
              </div>

              {result.incident_id && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/soc/incidents/${result.incident_id}`)}
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    VIEW SOC INCIDENT RECORD ({result.incident_id}) →
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
