import React, { useEffect, useState } from 'react'
import { getSoarPolicies, createSoarPolicy, toggleSoarPolicy, getSoarLogs } from '../api'

export default function SoarRules() {
  const [policies, setPolicies] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form state for creating new policy
  const [name, setName] = useState('')
  const [conditionType, setConditionType] = useState('risk_threshold')
  const [threshold, setThreshold] = useState(80)
  const [actionType, setActionType] = useState('block_user_and_ip')
  const [description, setDescription] = useState('')

  const fetchData = async () => {
    try {
      const [pRes, lRes] = await Promise.all([getSoarPolicies(), getSoarLogs()])
      setPolicies(pRes.policies || [])
      setLogs(lRes.logs || [])
    } catch (err) {
      console.error('Error loading SOAR data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleToggle = async (policyId, currentStatus) => {
    try {
      await toggleSoarPolicy(policyId, !currentStatus)
      fetchData()
    } catch (err) {
      alert(`Failed to update policy: ${err.message}`)
    }
  }

  const handleCreatePolicy = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createSoarPolicy({
        name,
        condition_type: conditionType,
        threshold: parseInt(threshold, 10),
        action_type: actionType,
        description
      })
      setShowModal(false)
      setName('')
      setDescription('')
      fetchData()
    } catch (err) {
      alert(`Error creating policy: ${err.message}`)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>⚡ SOAR & Autonomous Playbook Rules</h1>
          <p>Configure automated threat containment rules and review real-time response audit logs</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Create New SOAR Rule
        </button>
      </div>

      {/* Policies Grid */}
      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '24px' }}>
        {policies.map((p) => (
          <div key={p.id} className="card" style={{ borderLeft: p.enabled ? '4px solid var(--low)' : '4px solid var(--border-sub)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{p.name}</span>
              <button
                className={`toggle-btn ${p.enabled ? 'active' : ''}`}
                onClick={() => handleToggle(p.id, p.enabled)}
                style={{ fontSize: '11px', padding: '3px 8px' }}
              >
                {p.enabled ? '● Enabled' : '○ Disabled'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '12px' }}>{p.description}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-info">Condition: {p.condition_type}</span>
              {p.threshold && <span className="badge badge-medium">Threshold: ≥ {p.threshold}</span>}
              <span className="badge badge-critical">Action: {p.action_type}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Execution Audit Log Table */}
      <div className="card">
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>📋 Autonomous Response Execution Logs</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Policy Triggered</th>
                <th>Target Asset</th>
                <th>Action Executed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No execution logs yet. Trigger a Red Team simulation to test SOAR execution.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="td-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td style={{ fontWeight: 500 }}>{log.policy_name}</td>
                    <td className="td-mono">{log.target}</td>
                    <td>
                      <span className="badge badge-critical">{log.action_type}</span>
                    </td>
                    <td>
                      <span className="badge badge-low">⚡ Auto Executed ({log.status})</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Policy Creation */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '450px', background: 'var(--surface-2)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>Create SOAR Autonomous Policy Rule</h2>
            <form onSubmit={handleCreatePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                className="filter-input"
                placeholder="Policy Name (e.g. Critical API Rate Limiter)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <select className="filter-select" value={conditionType} onChange={(e) => setConditionType(e.target.value)}>
                <option value="risk_threshold">Risk Score Threshold</option>
                <option value="event_type">Event Type Pattern</option>
                <option value="severity">Severity Level</option>
              </select>
              {conditionType === 'risk_threshold' && (
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Risk Score Threshold (0-100)"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              )}
              <select className="filter-select" value={actionType} onChange={(e) => setActionType(e.target.value)}>
                <option value="block_user_and_ip">Block User & IP Quarantine</option>
                <option value="rate_limit_ip">IP Rate Limiting & Captcha</option>
                <option value="freeze_upi_vpa">Freeze UPI Transaction Channel</option>
                <option value="notify_soc_telegram">Send Telegram Alert Webhook</option>
              </select>
              <textarea
                className="feedback-textarea"
                placeholder="Rule description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
