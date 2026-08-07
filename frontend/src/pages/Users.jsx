import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, registerUser } from '../api'
import { RiskBadge } from '../components/Badge'
import { UserPlus, Shield, X, CheckCircle2 } from 'lucide-react'

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
  
  // Registration Modal State
  const [showRegModal, setShowRegModal] = useState(false)
  const [regForm, setRegForm] = useState({
    username: '',
    email: '',
    department: 'Engineering',
    baseline_country: 'India',
    baseline_device: 'Workstation'
  })
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')
  const [regSuccessMsg, setRegSuccessMsg] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(data || [])
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setRegError('')
    setRegSuccessMsg('')
    setRegLoading(true)

    try {
      const newUser = await registerUser(regForm)
      setRegSuccessMsg(`User '${newUser.username}' registered successfully!`)
      loadUsers()
      setTimeout(() => {
        setShowRegModal(false)
        setRegSuccessMsg('')
        setRegForm({
          username: '',
          email: '',
          department: 'Engineering',
          baseline_country: 'India',
          baseline_device: 'Workstation'
        })
      }, 1200)
    } catch (err) {
      setRegError(err.message || 'Failed to register user.')
    } finally {
      setRegLoading(false)
    }
  }

  const filtered = users.filter(u =>
    !search || u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0 }}>Registered User Directory</h1>
            <span style={{ background: 'var(--low-bg)', color: 'var(--low)', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 800 }}>
              DB REGISTERED USERS ONLY
            </span>
          </div>
          <p style={{ marginTop: '4px' }}>
            Showing {users.length} registered employees monitored by CyberNova ML engine.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowRegModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
        >
          <UserPlus size={16} /> Register New Employee
        </button>
      </div>

      {/* Registration Modal */}
      {showRegModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '28px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 50px rgba(0, 242, 254, 0.2)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowRegModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-sub)' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <Shield size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Register New User</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-sub)', margin: 0 }}>Add employee to system database</p>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '4px' }}>Username</label>
                <input
                  required
                  placeholder="e.g. neha_sharma"
                  value={regForm.username}
                  onChange={e => setRegForm(prev => ({ ...prev, username: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-sub)', borderRadius: '8px', padding: '10px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  placeholder="e.g. neha@cybernova.io"
                  value={regForm.email}
                  onChange={e => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-sub)', borderRadius: '8px', padding: '10px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '4px' }}>Department</label>
                  <select
                    value={regForm.department}
                    onChange={e => setRegForm(prev => ({ ...prev, department: e.target.value }))}
                    style={{ width: '100%', background: '#0d1117', border: '1px solid var(--border-sub)', borderRadius: '8px', padding: '10px', color: '#fff' }}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Finance">Finance</option>
                    <option value="Executive">Executive</option>
                    <option value="IT Ops">IT Ops</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '4px' }}>Baseline Country</label>
                  <input
                    value={regForm.baseline_country}
                    onChange={e => setRegForm(prev => ({ ...prev, baseline_country: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-sub)', borderRadius: '8px', padding: '10px', color: '#fff' }}
                  />
                </div>
              </div>

              {regError && (
                <div style={{ background: 'var(--critical-bg)', color: 'var(--critical)', border: '1px solid var(--critical)', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                  {regError}
                </div>
              )}

              {regSuccessMsg && (
                <div style={{ background: 'var(--low-bg)', color: 'var(--low)', border: '1px solid var(--low)', padding: '10px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> {regSuccessMsg}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={regLoading} style={{ marginTop: '10px' }}>
                {regLoading ? 'REGISTERING...' : 'SAVE & REGISTER USER'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Filter search */}
      <div className="filters" style={{ marginBottom: '20px' }}>
        <input
          id="search-users"
          className="filter-input"
          placeholder="Search registered user or department…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 260 }}
        />
      </div>

      {/* User Table */}
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
              {loading && <tr className="loading-row"><td colSpan={7}>Loading registered users…</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr className="loading-row"><td colSpan={7}>No registered users found</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} className="row-link" onClick={() => navigate(`/soc/users/${u.username}`)}>
                  <td style={{ fontWeight: 700, color: '#fff' }}>{u.username}</td>
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
