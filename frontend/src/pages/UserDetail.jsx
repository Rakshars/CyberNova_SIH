import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUser, getEvents } from '../api'
import { RiskBadge, AnomalyBadge } from '../components/Badge'

function fmt(dt) {
  if (!dt) return '—'
  const utc = dt.endsWith('Z') ? dt : dt + 'Z'
  return new Date(utc).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function Kv({ k, v }) {
  return (
    <div className="kv-row">
      <span className="kv-key">{k}</span>
      <span className="kv-val">{v || '—'}</span>
    </div>
  )
}

export default function UserDetail() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getUser(username).catch(() => null),
      getEvents({ username, page_size: 100 })
    ]).then(([u, evData]) => {
      setUser(u)
      setEvents(evData.items || [])
    }).finally(() => setLoading(false))
  }, [username])

  if (loading) return <div className="empty-state">Loading user profile…</div>
  if (!user) return <div className="empty-state">User not found.</div>

  return (
    <div>
      <div className="detail-header">
        <div>
          <div className="detail-meta" style={{ marginBottom: 8 }}>
            <span className="detail-id">@{user.username}</span>
            <RiskBadge value={user.risk_level} />
          </div>
          <div className="detail-title">{user.department || 'User Profile'}</div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Risk Profile</div>
          <div className="kv-list">
            <Kv k="Risk Score" v={<span className={`risk-score risk-${user.risk_level?.toLowerCase()}`}>{user.risk_score}</span>} />
            <Kv k="Risk Level" v={user.risk_level} />
            <Kv k="Last Updated" v={fmt(user.updated_at)} />
            <Kv k="Department" v={user.department} />
            <Kv k="Email" v={user.email} />
          </div>
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Behavioral Baseline</div>
          <div className="kv-list">
            <Kv k="Baseline Country" v={user.baseline_country} />
            <Kv k="Baseline Device" v={user.baseline_device} />
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6 }}>
            The ML model uses these baselines to detect anomalous behavior. Logins outside this profile will increase the anomaly score.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24, padding: 0 }}>
        <div className="section-title" style={{ padding: '20px 24px 0' }}>Recent Activity</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>IP Address</th>
                <th>Country</th>
                <th>Device</th>
                <th>Status</th>
                <th>Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr className="loading-row"><td colSpan={7}>No events found</td></tr>
              )}
              {events.map(ev => (
                <tr key={ev.id}>
                  <td className="td-mono">{fmt(ev.timestamp)}</td>
                  <td>{ev.event_type}</td>
                  <td className="td-mono">{ev.ip_address || '—'}</td>
                  <td className="td-sub">{ev.country || '—'}</td>
                  <td className="td-sub">{ev.device || '—'}</td>
                  <td>{ev.login_status || '—'}</td>
                  <td><AnomalyBadge value={ev.is_anomaly} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
