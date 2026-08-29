import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardSummary, getDashboardLivePanels, getIncidents, triggerRedTeamAttack } from '../api'
import StatCard from '../components/StatCard'
import HealthRing from '../components/HealthRing'
import { SeverityBadge, StatusBadge } from '../components/Badge'
import NetworkAttackModal from '../components/NetworkAttackModal'
import { Zap, Shield, Brain, TrendingUp, AlertTriangle, Terminal } from 'lucide-react'

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n
}

function SevBar({ label, count, max, color }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="sev-row">
      <span className="sev-label">{label}</span>
      <div className="sev-track">
        <div className="sev-fill" style={{ width: pct + '%', background: color }} />
      </div>
      <span className="sev-count">{count}</span>
    </div>
  )
}

const ATTACKS = [
  { type: 'brute_force',    label: '💥 Brute Force + Travel',  color: 'var(--red)',    dimColor: 'var(--red-dim)' },
  { type: 'upi_fraud',      label: '💳 Bharat UPI Fraud',      color: 'var(--orange)', dimColor: 'var(--orange-dim)' },
  { type: 'phishing_blast', label: '📱 SMS Scam Blast',        color: 'var(--blue-light)', dimColor: 'var(--blue-dim)' },
  { type: 'deepfake_wire',  label: '🎭 Deepfake Wire Fraud',   color: 'var(--yellow)', dimColor: 'var(--yellow-dim)' },
]

export default function Dashboard() {
  const [summary, setSummary]               = useState(null)
  const [livePanels, setLivePanels]         = useState(null)
  const [recentIncidents, setRecentIncidents] = useState([])
  const [loading, setLoading]               = useState(true)
  const [attackToast, setAttackToast]       = useState(null)
  const [triggering, setTriggering]         = useState(false)
  const [activeNetworkAttack, setActiveNetworkAttack] = useState(null)
  const navigate = useNavigate()

  const refreshData = () => {
    Promise.all([
      getDashboardSummary(),
      getDashboardLivePanels(),
      getIncidents({ page: 1, page_size: 5 }),
    ]).then(([s, panels, i]) => {
      setSummary(s)
      setLivePanels(panels)
      setRecentIncidents(i.items)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 15000)
    return () => clearInterval(interval)
  }, [])

  const [activeAttackType, setActiveAttackType] = useState(null)

  const handleLaunchAttack = async (type) => {
    setTriggering(true)
    setActiveAttackType(type)
    try {
      const res = await triggerRedTeamAttack(type)
      setActiveNetworkAttack({
        attack_type: res.attack_type,
        target_user: res.target_user,
        attacker_ip: res.attacker_ip,
        incident: res.incident_summary,
        actions: res.soar_autonomous_actions
      })
      setAttackToast(`🚨 LIVE ATTACK LAUNCHED: ${res.incident_summary.title} | SOAR CONTAINMENT: ${res.soar_autonomous_actions.length} ACTIONS AUTO-EXECUTED`)
      refreshData()
      setTimeout(() => setAttackToast(null), 7000)
    } catch (err) {
      alert(`Error triggering attack: ${err.message}`)
    } finally {
      setTriggering(false)
      setActiveAttackType(null)
    }
  }

  const s = summary || {}
  const maxSev = Math.max(s.critical_incidents || 0, s.high_incidents || 0, s.medium_incidents || 0, s.low_incidents || 0, 1)

  return (
    <div>
      {activeNetworkAttack && (
        <NetworkAttackModal attackInfo={activeNetworkAttack} onClose={() => setActiveNetworkAttack(null)} />
      )}
      {attackToast && <div className="toast">{attackToast}</div>}

      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>
            CyberNova AI Autonomous SOC
            <span className="badge badge-low" style={{ fontSize: 10 }}>● 100% Autonomous Mode</span>
          </h1>
          <p>Real-time telemetry monitoring, explainable AI anomaly engine &amp; instant SOAR playbooks</p>
        </div>
      </div>

      {/* Red Team Attack Launcher */}
      <div className="card attack-launcher" style={{
        marginBottom: 20,
        borderColor: 'rgba(232,64,64,0.20)',
        background: 'linear-gradient(135deg, rgba(232,64,64,0.04) 0%, var(--surface) 60%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Terminal size={14} color="var(--red)" />
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Live Red Team Demo Attack Launcher</span>
          <span className="badge badge-critical" style={{ fontSize: 10 }}>Interactive Mesh Animation</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
          Click any scenario to trigger synthetic threats and watch CyberNova contain them live.
        </p>
        <div className="attack-btn-row">
          {ATTACKS.map(({ type, label, color, dimColor }) => {
            const isThisTriggering = activeAttackType === type
            return (
              <button
                key={type}
                className="btn attack-btn"
                disabled={triggering}
                onClick={() => handleLaunchAttack(type)}
                style={{
                  fontSize: 12,
                  background: isThisTriggering ? 'var(--red-dim)' : dimColor,
                  border: `1px solid ${isThisTriggering ? 'var(--red)' : color}`,
                  color: 'var(--text)',
                  opacity: triggering && !isThisTriggering ? 0.5 : 1,
                  cursor: triggering ? 'wait' : 'pointer'
                }}
              >
                {isThisTriggering ? '⚡ Launching Attack...' : label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard label="Total Telemetry Events"    value={fmt(s.total_events)}    sub={`${fmt(s.events_last_24h)} in last 24h`} />
        <StatCard label="Total Correlated Incidents" value={fmt(s.total_incidents)} sub={`${fmt(s.incidents_last_24h)} in last 24h`} />
        <StatCard label="Critical Threats"          value={fmt(s.open_incidents)} />
        <StatCard label="Anomalies Flagged"         value={fmt(s.total_anomalies)} />
        <StatCard label="Protected Users"           value={fmt(s.unique_users)} />
        <StatCard label="Monitored IPs"             value={fmt(s.unique_ips)} />
      </div>

      {/* 3-column grid */}
      <div className="dash-grid" style={{ marginBottom: 20 }}>
        {/* Security Health */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <Shield size={13} color="var(--text-3)" />
            <span className="section-title" style={{ margin: 0 }}>Security Health &amp; Risk Score</span>
          </div>
          <div className="health-wrap">
            <HealthRing score={s.security_health_score ?? 0} />
            <div className="sev-bar-wrap">
              <SevBar label="Critical" count={s.critical_incidents || 0} max={maxSev} color="var(--red)" />
              <SevBar label="High"     count={s.high_incidents     || 0} max={maxSev} color="var(--orange)" />
              <SevBar label="Medium"   count={s.medium_incidents   || 0} max={maxSev} color="var(--yellow)" />
              <SevBar label="Low"      count={s.low_incidents      || 0} max={maxSev} color="var(--green)" />
            </div>
          </div>
        </div>

        {/* FinTech Monitor */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <TrendingUp size={13} color="var(--text-3)" />
            <span className="section-title" style={{ margin: 0 }}>🇮🇳 Bharat FinTech &amp; UPI Threat Monitor</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                title: 'UPI VPA Micro-Debit Velocity',
                badge: <span className="badge badge-low">⚡ Auto Shield</span>,
                text: livePanels
                  ? `${livePanels.upi_total_events} UPI events monitored · ${livePanels.upi_anomaly_count} anomalies flagged · ${livePanels.upi_blocked_count} VPAs blocked`
                  : 'Monitoring rapid sequential transaction anomalies across UPI VPAs.'
              },
              {
                title: 'Electricity & Bank SMS Extortion Filter',
                badge: <span className="badge badge-info">NLP Active</span>,
                text: livePanels
                  ? `${livePanels.nlp_scan_count} messages scanned · ${livePanels.nlp_blocked_count} phishing domains quarantined`
                  : 'Real-time NLP scanning for fake KYC / power disconnection scam links.'
              }
            ].map(({ title, badge, text }) => (
              <div key={title} style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                padding: '11px 13px', borderRadius: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: 13, marginBottom: 5 }}>
                  <span>{title}</span>
                  {badge}
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* XAI Risk Model */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <Brain size={13} color="var(--text-3)" />
            <span className="section-title" style={{ margin: 0 }}>🔍 Explainable AI (XAI) Risk Model</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            {livePanels?.xai_risk_factors?.length > 0
              ? livePanels.xai_risk_factors.map((factor, idx) => {
                  const cls = factor.points >= 30 ? 'badge-critical' : factor.points >= 20 ? 'badge-high' : 'badge-medium'
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{factor.reason}</span>
                      <span className={`badge ${cls}`}>+{factor.points} pts</span>
                    </div>
                  )
                })
              : [
                  ['Impossible Travel Speed', 38, 'badge-critical'],
                  ['Failed Password Burst', 26, 'badge-high'],
                  ['UPI Transaction Deviation', 20, 'badge-high'],
                  ['Unusual Tor / ASN IP', 16, 'badge-medium'],
                ].map(([reason, pts, cls]) => (
                  <div key={reason} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{reason}</span>
                    <span className={`badge ${cls}`}>+{pts} pts</span>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
              <AlertTriangle size={13} color="var(--text-3)" />
              <span className="section-title" style={{ margin: 0 }}>🚨 Live Incident Feed &amp; SOAR Containment Actions</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Click any incident to view MITRE ATT&amp;CK breakdown and AI Detective analysis.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/soc/incidents')}>
            View all →
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Risk Score</th><th>Affected User</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="loading-row"><td colSpan={6}>Loading…</td></tr>}
              {!loading && recentIncidents.length === 0 && <tr className="loading-row"><td colSpan={6}>No incidents found</td></tr>}
              {recentIncidents.map(inc => (
                <tr key={inc.id} className="row-link" onClick={() => navigate(`/soc/incidents/${inc.incident_id}`)}>
                  <td className="td-mono">{inc.incident_id}</td>
                  <td style={{ maxWidth: 280, fontWeight: 500 }}>{inc.title}</td>
                  <td><SeverityBadge value={inc.severity} /></td>
                  <td><StatusBadge value={inc.status} /></td>
                  <td><span className={`risk-score risk-${(inc.severity || 'low').toLowerCase()}`}>{inc.risk_score}</span></td>
                  <td className="td-sub">{inc.affected_username || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
