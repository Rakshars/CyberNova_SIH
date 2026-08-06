import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { simulateEvent } from '../api'

export default function Simulator() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  
  // Default values for a simulated attack
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      // Add a timestamp
      const payload = {
        ...formData,
        timestamp: new Date().toISOString()
      }
      const res = await simulateEvent(payload)
      setResult(res)
    } catch (err) {
      alert('Error simulating event: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 style={{ textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent)' }}>Attack Simulator</h1>
        <p>Manually inject security events to test the ML anomaly detection and correlation engine.</p>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Simulate Event</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Username</label>
              <input name="username" className="filter-input" value={formData.username} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>IP Address</label>
                <input name="ip_address" className="filter-input" value={formData.ip_address} onChange={handleChange} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Country</label>
                <input name="country" className="filter-input" value={formData.country} onChange={handleChange} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Device</label>
                <input name="device" className="filter-input" value={formData.device} onChange={handleChange} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Status</label>
                <select name="login_status" className="filter-select" value={formData.login_status} onChange={handleChange} style={{ width: '100%' }}>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={loading}>
              {loading ? 'Injecting...' : 'Inject Event'}
            </button>
          </form>
        </div>

        {result && (
          <div className="card" style={{ borderColor: result.is_anomaly ? 'var(--critical)' : 'var(--low)' }}>
            <div className="section-title" style={{ marginBottom: 16, color: result.is_anomaly ? 'var(--critical)' : 'var(--low)' }}>Processing Result</div>
            <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 8, fontSize: 13 }}>
              <p style={{ color: result.is_anomaly ? 'var(--critical)' : 'var(--low)', fontWeight: 'bold', marginBottom: 8 }}>
                {result.is_anomaly ? '⚠️ Anomaly Detected!' : '✅ Normal Event'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Risk Score:</span>
                <strong className={`risk-${result.risk_level?.toLowerCase()}`}>{result.risk_score} / 100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>ML Score:</span>
                <span>{result.ml_anomaly_score?.toFixed(3)}</span>
              </div>
              
              <strong style={{ display: 'block', marginBottom: 4 }}>Risk Factors:</strong>
              <ul style={{ paddingLeft: 16, marginBottom: 16, color: 'var(--text-sub)' }}>
                {result.risk_reasons?.map((r, i) => (
                  <li key={i}>{r.label} <span style={{ opacity: 0.5 }}>(+{r.points})</span></li>
                ))}
              </ul>

              {result.incident_id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <p style={{ color: 'var(--critical)', marginBottom: 8, fontWeight: 'bold' }}>[!] INCIDENT CREATED: {result.incident_id}</p>
                  <button className="btn btn-primary" onClick={() => navigate(`/soc/incidents/${result.incident_id}`)} style={{ fontSize: 11 }}>
                    ACCESS SOC RECORD →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
