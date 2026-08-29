import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser, getUsers } from '../api'
import { Shield, UserPlus, LogIn, CheckCircle2, AlertTriangle, Users as UsersIcon, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const inputStyle = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)',
  padding: '9px 12px',
  color: 'var(--text)',
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  transition: 'border-color 140ms ease',
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const { theme, toggle: toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('login')

  const [loginUsername, setLoginUsername] = useState('vikram')
  const [loginPassword, setLoginPassword] = useState('password123')
  const [showPassword, setShowPassword]   = useState(false)
  const [loginLoading, setLoginLoading]   = useState(false)
  const [loginError, setLoginError]       = useState('')

  const [regForm, setRegForm] = useState({
    username: '', password: '', email: '',
    department: 'Engineering', baseline_country: 'India', baseline_device: 'MacBook Pro Workstation'
  })
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError]     = useState('')
  const [regSuccess, setRegSuccess] = useState(null)

  const [registeredUsers, setRegisteredUsers] = useState([])

  useEffect(() => { fetchUsersList() }, [])

  const fetchUsersList = async () => {
    try { setRegisteredUsers(await getUsers() || []) }
    catch (err) { console.error('Failed to fetch users:', err) }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const user = await loginUser({ username: loginUsername, password: loginPassword })
      localStorage.setItem('cybernova_user', JSON.stringify(user))
      window.dispatchEvent(new Event('cybernova_auth_change'))
      navigate('/soc')
    } catch (err) {
      setLoginError(err.message || 'Login failed. Invalid username or password.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError(''); setRegSuccess(null)
    setRegLoading(true)
    try {
      const newUser = await registerUser(regForm)
      setRegSuccess(newUser)
      fetchUsersList()
      localStorage.setItem('cybernova_user', JSON.stringify(newUser))
      window.dispatchEvent(new Event('cybernova_auth_change'))
    } catch (err) {
      setRegError(err.message || 'Failed to register user.')
    } finally {
      setRegLoading(false)
    }
  }

  const focusBorder = e => e.target.style.borderColor = 'var(--blue)'
  const blurBorder  = e => e.target.style.borderColor = 'var(--border)'

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Inter, sans-serif', color: 'var(--text)'
    }}>
      {/* Theme toggle top-right */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'fixed', top: 16, right: 16,
          width: 34, height: 34, borderRadius: 'var(--r-sm)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--text-2)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', zIndex: 100
        }}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
      <div style={{
        maxWidth: 900, width: '100%',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 20,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 28,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>

        {/* Left: Auth Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--r-sm)',
              background: 'var(--blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Shield size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>CyberNova Auth Portal</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 2 }}>
                Secure Password-Protected Access
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--surface-2)',
            padding: 3, borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)', marginBottom: 20
          }}>
            {[['login', <LogIn size={13} />, 'User Login'], ['register', <UserPlus size={13} />, 'Register New User']].map(([id, icon, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  flex: 1, padding: '8px 10px',
                  borderRadius: 5, border: 'none',
                  background: activeTab === id ? 'var(--blue)' : 'transparent',
                  color: activeTab === id ? '#fff' : 'var(--text-2)',
                  fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  transition: 'all 140ms ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit'
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Select Registered Username">
                <select
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                  onFocus={focusBorder} onBlur={blurBorder}
                >
                  {registeredUsers.map(u => (
                    <option key={u.id} value={u.username}>
                      {u.username} — {u.department || 'User'} ({u.risk_level} Risk)
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Account Password">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password (default: password123)"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: 38 }}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 10, top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-3)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>

              {loginError && (
                <div className="alert alert-error">
                  <AlertTriangle size={13} /> {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="btn btn-primary"
                style={{ padding: '11px', fontSize: 13, fontWeight: 600, marginTop: 2, justifyContent: 'center' }}
              >
                {loginLoading ? 'Verifying credentials…' : 'Authenticate & Enter SOC →'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Username">
                <input required placeholder="e.g. dev_admin" value={regForm.username}
                  onChange={e => setRegForm(p => ({ ...p, username: e.target.value }))}
                  style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
              </Field>
              <Field label="Password">
                <input type="password" required placeholder="Create secure password" value={regForm.password}
                  onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                  style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
              </Field>
              <Field label="Email Address">
                <input type="email" placeholder="user@cybernova.io" value={regForm.email}
                  onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))}
                  style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Department">
                  <select value={regForm.department}
                    onChange={e => setRegForm(p => ({ ...p, department: e.target.value }))}
                    style={inputStyle} onFocus={focusBorder} onBlur={blurBorder}>
                    <option>Engineering</option><option>Finance</option>
                    <option>Executive</option><option>IT Ops</option><option>HR</option>
                  </select>
                </Field>
                <Field label="Country">
                  <input value={regForm.baseline_country}
                    onChange={e => setRegForm(p => ({ ...p, baseline_country: e.target.value }))}
                    style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
                </Field>
              </div>

              {regError && <div className="alert alert-error"><AlertTriangle size={13} /> {regError}</div>}
              {regSuccess && (
                <div className="alert alert-success">
                  <CheckCircle2 size={13} /> User '{regSuccess.username}' registered successfully!
                </div>
              )}

              <button type="submit" disabled={regLoading} className="btn btn-primary"
                style={{ padding: '11px', fontSize: 13, fontWeight: 600, marginTop: 2, justifyContent: 'center' }}>
                {regLoading ? 'Hashing password & registering…' : 'Register & Enter SOC →'}
              </button>
            </form>
          )}
        </div>

        {/* Right: Users Directory */}
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 18,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UsersIcon size={15} color="var(--blue-light)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                Registered Users ({registeredUsers.length})
              </span>
            </div>
            <span style={{
              fontSize: 10, background: 'var(--green-dim)', color: 'var(--green)',
              padding: '2px 8px', borderRadius: 99, fontWeight: 600,
              border: '1px solid var(--green-border)'
            }}>
              SHA-256 ENCRYPTED
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360 }}>
            {registeredUsers.map(u => (
              <div key={u.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={11} color="var(--blue-light)" />
                    {u.username}
                  </div>
                  <div style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 2 }}>
                    {u.department} · {u.email}
                  </div>
                </div>
                <span className={`badge badge-${u.risk_level?.toLowerCase() || 'low'}`}>
                  {u.risk_level} · {u.risk_score}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
            All credentials encrypted with SHA-256 salt hashing in cybernova.db
          </div>
        </div>

      </div>
    </div>
  )
}
