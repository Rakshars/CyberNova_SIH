import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers } from '../api'
import { RiskBadge } from '../components/Badge'

function RiskBar({ score }) {
  const pct = Math.min(100, Math.max(0, score))
  const color =
    pct >= 75 ? 'var(--critical)' :
    pct >= 50 ? 'var(--high)' :
    pct >= 25 ? 'var(--medium)' :
                'var(--low)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 30, textAlign: 'right' }}>{Math.round(pct)}</span>
    </div>
  )
}

export default function Users() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getUsers().then(setUsers).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    !search || u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <p>{users.length} users monitored, sorted by risk score</p>
      </div>

      <div className="filters">
        <input
          id="search-users"
          className="filter-input"
          placeholder="Search user or department…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Department</th>
                <th>Email</th>
                <th>Risk Level</th>
                <th style={{ minWidth: 150 }}>Risk Score</th>
                <th>Baseline Country</th>
                <th>Baseline Device</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="loading-row"><td colSpan={7}>Loading…</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr className="loading-row"><td colSpan={7}>No users found</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} className="row-link" onClick={() => navigate(`/soc/users/${u.username}`)}>
                  <td style={{ fontWeight: 500 }}>{u.username}</td>
                  <td className="td-sub">{u.department || '—'}</td>
                  <td className="td-sub td-mono">{u.email || '—'}</td>
                  <td><RiskBadge value={u.risk_level} /></td>
                  <td><RiskBar score={u.risk_score} /></td>
                  <td className="td-sub">{u.baseline_country || '—'}</td>
                  <td className="td-sub">{u.baseline_device || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
