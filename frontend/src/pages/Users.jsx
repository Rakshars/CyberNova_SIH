import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, registerUser } from '../api'
import { RiskBadge } from '../components/Badge'
import { UserPlus, X, CheckCircle2, AlertTriangle } from 'lucide-react'

function RiskBar({ score }) {
  const pct = Math.min(100, Math.max(0, score))
  const color = pct >= 75 ? 'var(--red)' : pct >= 50 ? 'var(--orange)' : pct >= 25 ? 'var(--yellow)' : 'var(--green)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, width: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(pct)}</span>
    </div>
  )
}

export default function Users() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [regForm, setRegForm] = useState({ username: '', email: '', department: 'Engineering', baseline_country: 'India', baseline_device: 'Workstation' })
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')
  const [regSuccess, setRegSuccess] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    try { setUsers(await getUsers() || []) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [])

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError(''); setRegSuccess('')
    setRegLoading(true)
    try {
      const u = await registerUser(regForm)
      setRegSuccess(`User '${u.username}' registered.`)
      loadUsers()
      setTimeout(() => { setShowModal(false); setRegSuccess(''); setRegForm({ username: '', email: '', department: 'Engineering', baseline_country: 'India', baseline_device: 'Workstation' }) }, 1200)
    } catch (err) { setRegError(err.message || 'Registration failed.') }
    finally { setRegLoading(false) }
  }

  const filtered = users.filter(u =>
    !search || u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Users</h1>
          <p>{users.length} registered users monitored by the ML engine</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={13} /> Register user
        </button>
      </div>

      <div className="filters">
        <input
          className="filter-input"
          placeholder="Search by username or department…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 240 }}
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
                <th style={{ minWidth: 140 }}>Risk Score</th>
                <th>Country</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="loading-row"><td colSpan={7}>Loading…</td></tr>}
              {!loading && filtered.length === 0 && <tr className="loading-row"><td colSpan={7}>No users found</td></tr>}
              {filtered.map(u => (
                <tr key={u.id} className="row-link" onClick={() => navigate(`/soc/users/${u.username}`)}>
                  <td style={{ fontWeight: 600 }}>{u.username}</td>
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

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Register user</span>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-2)' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input required placeholder="e.g. analyst_01" value={regForm.username}
                  onChange={e => setRegForm(p => ({ ...p, username: e.target.value }))} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" placeholder="user@example.com" value={regForm.email}
                  onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} className="form-input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={regForm.department}
                    onChange={e => setRegForm(p => ({ ...p, department: e.target.value }))}>
                    <option>Engineering</option><option>Finance</option><option>Executive</option><option>IT Ops</option><option>HR</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input value={regForm.baseline_country}
                    onChange={e => setRegForm(p => ({ ...p, baseline_country: e.target.value }))} className="form-input" />
                </div>
              </div>
              {regError && <div className="alert alert-error"><AlertTriangle size={13} />{regError}</div>}
              {regSuccess && <div className="alert alert-success"><CheckCircle2 size={13} />{regSuccess}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={regLoading}>
                  {regLoading ? 'Registering…' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
