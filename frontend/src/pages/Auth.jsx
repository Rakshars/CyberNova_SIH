import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser, getUsers } from '../api'
import { Shield, UserPlus, LogIn, CheckCircle2, AlertTriangle, Users as UsersIcon, Lock, Eye, EyeOff } from 'lucide-react'

export default function Auth() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('login') // 'login' | 'register'
  
  // Login Form
  const [loginUsername, setLoginUsername] = useState('vikram')
  const [loginPassword, setLoginPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Register Form
  const [regForm, setRegForm] = useState({
    username: '',
    password: '',
    email: '',
    department: 'Engineering',
    baseline_country: 'India',
    baseline_device: 'MacBook Pro Workstation'
  })
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')
  const [regSuccess, setRegSuccess] = useState(null)

  // List of registered users fetched directly from DB
  const [registeredUsers, setRegisteredUsers] = useState([])

  useEffect(() => {
    fetchUsersList()
  }, [])

  const fetchUsersList = async () => {
    try {
      const users = await getUsers()
      setRegisteredUsers(users || [])
    } catch (err) {
      console.error('Failed to fetch registered users list:', err)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const user = await loginUser({
        username: loginUsername,
        password: loginPassword
      })
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
    setRegError('')
    setRegSuccess(null)
    setRegLoading(true)

    try {
      const newUser = await registerUser(regForm)
      setRegSuccess(newUser)
      fetchUsersList()
      // Auto save login
      localStorage.setItem('cybernova_user', JSON.stringify(newUser))
      window.dispatchEvent(new Event('cybernova_auth_change'))
    } catch (err) {
      setRegError(err.message || 'Failed to register user.')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(ellipse at top, #111827 0%, #030712 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: '#fff',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        maxWidth: '920px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 242, 254, 0.15)'
      }}>

        {/* Left Side: Auth Form Container */}
        <div>
          {/* Logo & Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 242, 254, 0.5)'
            }}>
              <Shield size={22} color="#030712" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>CyberNova Auth Portal</h2>
              <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>SECURE PASSWORD-PROTECTED ACCESS</span>
            </div>
          </div>

          {/* Tab Controls */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--border-sub)',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => setActiveTab('login')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'login' ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' : 'transparent',
                color: activeTab === 'login' ? '#030712' : 'var(--text-sub)',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <LogIn size={15} /> User Login
            </button>

            <button
              onClick={() => setActiveTab('register')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'register' ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' : 'transparent',
                color: activeTab === 'register' ? '#030712' : 'var(--text-sub)',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <UserPlus size={15} /> Register New User
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '4px' }}>
                  Select Registered Username
                </label>
                <select
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0d1117',
                    border: '1px solid rgba(0, 242, 254, 0.4)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '13px',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {registeredUsers.map(u => (
                    <option key={u.id} value={u.username}>
                      {u.username} — {u.department || 'User'} ({u.risk_level} Risk)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '4px' }}>
                  Account Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password (default: password123)"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0d1117',
                      border: '1px solid rgba(0, 242, 254, 0.4)',
                      borderRadius: '10px',
                      padding: '10px 38px 10px 12px',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-sub)',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div style={{ background: 'var(--critical-bg)', border: '1px solid var(--critical)', color: 'var(--critical)', padding: '10px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} /> {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                  border: 'none',
                  color: '#030712',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px'
                }}
              >
                {loginLoading ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE & ENTER SOC →'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '4px' }}>Username</label>
                <input
                  required
                  placeholder="e.g. dev_admin"
                  value={regForm.username}
                  onChange={e => setRegForm(prev => ({ ...prev, username: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#0d1117',
                    border: '1px solid rgba(0, 242, 254, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '4px' }}>Account Password</label>
                <input
                  type="password"
                  required
                  placeholder="Create secure password"
                  value={regForm.password}
                  onChange={e => setRegForm(prev => ({ ...prev, password: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#0d1117',
                    border: '1px solid rgba(0, 242, 254, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '4px' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. user@cybernova.io"
                  value={regForm.email}
                  onChange={e => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#0d1117',
                    border: '1px solid rgba(0, 242, 254, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '4px' }}>Department</label>
                  <select
                    value={regForm.department}
                    onChange={e => setRegForm(prev => ({ ...prev, department: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#0d1117',
                      border: '1px solid rgba(0, 242, 254, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '12px'
                    }}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Finance">Finance</option>
                    <option value="Executive">Executive</option>
                    <option value="IT Ops">IT Ops</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '4px' }}>Country</label>
                  <input
                    value={regForm.baseline_country}
                    onChange={e => setRegForm(prev => ({ ...prev, baseline_country: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#0d1117',
                      border: '1px solid rgba(0, 242, 254, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              {regError && (
                <div style={{ background: 'var(--critical-bg)', border: '1px solid var(--critical)', color: 'var(--critical)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div style={{ background: 'var(--low-bg)', border: '1px solid var(--low)', color: 'var(--low)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> User '{regSuccess.username}' registered successfully with hashed password!
                </div>
              )}

              <button
                type="submit"
                disabled={regLoading}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                  border: 'none',
                  color: '#030712',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px'
                }}
              >
                {regLoading ? 'HASHING PASSWORD & REGISTERING...' : 'REGISTER & ENTER SOC →'}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Registered Database Users Directory */}
        <div style={{
          background: 'rgba(13, 17, 23, 0.75)',
          border: '1px solid var(--border-sub)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UsersIcon size={18} color="var(--accent)" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Registered System Users ({registeredUsers.length})
              </h3>
            </div>
            <span style={{ fontSize: '10px', background: 'var(--low-bg)', color: 'var(--low)', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>
              SHA-256 ENCRYPTED
            </span>
          </div>

          {/* Users List Container */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '340px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {registeredUsers.map(u => (
              <div key={u.id} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-sub)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={12} color="var(--accent)" />
                    {u.username}
                  </div>
                  <div style={{ color: 'var(--text-sub)', fontSize: '11px' }}>{u.department} • {u.email}</div>
                </div>

                <span className={`badge badge-${u.risk_level?.toLowerCase() || 'low'}`}>
                  {u.risk_level} Risk ({u.risk_score})
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-sub)', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
            All user credentials are encrypted with SHA-256 salt hashing in `cybernova.db`.
          </div>
        </div>

      </div>
    </div>
  )
}
