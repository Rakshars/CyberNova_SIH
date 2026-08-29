import { useEffect, useState } from 'react'
import { getSoarPolicies, createSoarPolicy, toggleSoarPolicy, getSoarLogs } from '../api'
import { Plus, X } from 'lucide-react'

export default function SoarRules() {
  const [policies, setPolicies] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
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
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleToggle = async (policyId, currentStatus) => {
    try { await toggleSoarPolicy(policyId, !currentStatus); fetchData() }
    catch (err) { alert(err.message) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createSoarPolicy({ name, condition_type: conditionType, threshold: parseInt(threshold, 10), action_type: actionType, description })
      setShowModal(false)
      setName(''); setDescription('')
      fetchData()
    } catch (err) { alert(err.message) }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>SOAR Playbooks</h1>
          <p>Automated threat response rules and execution audit log</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={13} /> New rule
        </button>
      </div>

      {/* Policies */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 24 }}>
        {loading && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>}
        {policies.map(p => (
          <div key={p.id} className="card" style={{ borderLeft: `3px solid ${p.enabled ? 'var(--green)' : 'var(--border)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{p.name}</span>
              <button
                onClick={() => handleToggle(p.id, p.enabled)}
                className={`btn btn-sm ${p.enabled ? 'btn-ghost' : 'btn-ghost'}`}
                style={{
                  color: p.enabled ? 'var(--green)' : 'var(--text-3)',
                  borderColor: p.enabled ? 'var(--green-border)' : 'var(--border)',
                  background: p.enabled ? 'var(--green-dim)' : 'transparent',
                  flexShrink: 0
                }}
              >
                {p.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.5 }}>{p.description}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-info">{p.condition_type}</span>
              {p.threshold && <span className="badge badge-neutral">≥ {p.threshold}</span>}
              <span className="badge badge-critical">{p.action_type}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Audit log */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="section-title" style={{ margin: 0 }}>Execution Log</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Policy</th>
                <th>Target</th>
                <th>Action</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr className="loading-row">
                  <td colSpan={5}>No execution logs. Trigger a simulation to test SOAR.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td className="td-mono">
                      {new Date(log.timestamp.endsWith('Z') ? log.timestamp : log.timestamp + 'Z').toLocaleTimeString()}
                    </td>
                    <td style={{ fontWeight: 500 }}>{log.policy_name}</td>
                    <td className="td-mono">{log.target}</td>
                    <td><span className="badge badge-critical">{log.action_type}</span></td>
                    <td><span className="badge badge-low">{log.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">New SOAR Rule</span>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-2)' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Rule name</label>
                <input required placeholder="e.g. Critical API Rate Limiter" value={name}
                  onChange={e => setName(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Condition type</label>
                <select className="form-select" value={conditionType} onChange={e => setConditionType(e.target.value)}>
                  <option value="risk_threshold">Risk Score Threshold</option>
                  <option value="event_type">Event Type Pattern</option>
                  <option value="severity">Severity Level</option>
                </select>
              </div>
              {conditionType === 'risk_threshold' && (
                <div className="form-group">
                  <label className="form-label">Threshold (0–100)</label>
                  <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} className="form-input" />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Action</label>
                <select className="form-select" value={actionType} onChange={e => setActionType(e.target.value)}>
                  <option value="block_user_and_ip">Block user & IP</option>
                  <option value="rate_limit_ip">Rate limit IP</option>
                  <option value="freeze_upi_vpa">Freeze UPI channel</option>
                  <option value="notify_soc_telegram">Send Telegram alert</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Rule description…" value={description}
                  onChange={e => setDescription(e.target.value)} rows={3} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
