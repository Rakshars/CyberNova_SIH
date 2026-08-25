import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardSummary, getDashboardLivePanels, getIncidents, triggerRedTeamAttack } from '../api'
import StatCard from '../components/StatCard'
import HealthRing from '../components/HealthRing'
import { SeverityBadge, StatusBadge } from '../components/Badge'
import NetworkAttackModal from '../components/NetworkAttackModal'

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

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [livePanels, setLivePanels] = useState(null)
  const [recentIncidents, setRecentIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [attackToast, setAttackToast] = useState(null)
  const [triggering, setTriggering] = useState(false)
  const [activeNetworkAttack, setActiveNetworkAttack] = useState(null)
  const navigate = useNavigate()

  const refreshData = () => {
    Promise.all([
      getDashboardSummary(),
      getDashboardLivePanels(),
      getIncidents({ page: 1, page_size: 5 }),
    ])
      .then(([s, panels, i]) => {
        setSummary(s)
        setLivePanels(panels)
        setRecentIncidents(i.items)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refreshData()
    // Auto-refresh every 15 seconds for live data
    const interval = setInterval(refreshData, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleLaunchAttack = async (type) => {
    setTriggering(true)
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
    }
  }

  const s = summary || {}
  const maxSev = Math.max(s.critical_incidents || 0, s.high_incidents || 0, s.medium_incidents || 0, s.low_incidents || 0, 1)

  return (
    <div>
      {/* 🌐 Network Mesh Cyber Attack & SOAR Animation Modal */}
      {activeNetworkAttack && (
        <NetworkAttackModal
          attackInfo={activeNetworkAttack}
          onClose={() => setActiveNetworkAttack(null)}
        />
      )}

      {/* Toast popup */}
      {attackToast && (
        <div className="toast">
          {attackToast}
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>CyberNova AI Autonomous SOC Command</span>
            <span className="badge badge-low" style={{ fontSize: '11px' }}>● 100% Autonomous Mode</span>
          </h1>
          <p>Real-Time Telemetry Monitoring, Explainable AI Anomaly Engine & Instant SOAR Playbooks</p>
        </div>
      </div>

      {/* 💥 1-Click Red Team Quick Attack Bar */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(255,42,109,0.08) 0%, rgba(0,242,254,0.05) 100%)', border: '1px solid rgba(255,42,109,0.3)', boxShadow: '0 0 30px rgba(255,42,109,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--critical)' }}>⚡ LIVE RED TEAM DEMO ATTACK LAUNCHER</span>
              <span style={{ fontSize: '10px', background: 'var(--critical-bg)', color: 'var(--critical)', padding: '2px 8px', borderRadius: '4px' }}>INTERACTIVE MESH ANIMATION</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: 2 }}>Click any attack scenario below to trigger synthetic threats and watch CyberNova contain them live in micro-seconds.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn" style={{ background: 'rgba(255,42,109,0.15)', borderColor: 'var(--critical)', color: '#fff', fontSize: '12px' }} disabled={triggering} onClick={() => handleLaunchAttack('brute_force')}>
              💥 Brute Force + Travel
            </button>
            <button className="btn" style={{ background: 'rgba(255,170,0,0.15)', borderColor: 'var(--high)', color: '#fff', fontSize: '12px' }} disabled={triggering} onClick={() => handleLaunchAttack('upi_fraud')}>
              💳 Bharat UPI Fraud
            </button>
            <button className="btn" style={{ background: 'rgba(0,242,254,0.15)', borderColor: 'var(--accent)', color: '#fff', fontSize: '12px' }} disabled={triggering} onClick={() => handleLaunchAttack('phishing_blast')}>
              📱 SMS Scam Blast
            </button>
            <button className="btn" style={{ background: 'rgba(5,255,161,0.15)', borderColor: 'var(--low)', color: '#fff', fontSize: '12px' }} disabled={triggering} onClick={() => handleLaunchAttack('deepfake_wire')}>
              🎭 Deepfake Wire Fraud
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <StatCard label="Total Telemetry Events" value={fmt(s.total_events)} sub={`${fmt(s.events_last_24h)} in last 24h`} />
        <StatCard label="Total Correlated Incidents" value={fmt(s.total_incidents)} sub={`${fmt(s.incidents_last_24h)} in last 24h`} />
        <StatCard label="Critical Threats" value={fmt(s.open_incidents)} accent="var(--critical)" />
        <StatCard label="Anomalies Flagged" value={fmt(s.total_anomalies)} accent="var(--high)" />
        <StatCard label="Protected Users" value={fmt(s.unique_users)} />
        <StatCard label="Monitored IPs" value={fmt(s.unique_ips)} />
      </div>

      {/* Health + Threat Radar + Explainable AI */}
      <div className="dash-grid" style={{ marginBottom: 24 }}>
        {/* Security Health */}
        <div className="card">
          <div className="section-title">🛡️ Security Health & Risk Score</div>
          <div className="health-wrap" style={{ marginTop: 10 }}>
            <HealthRing score={s.security_health_score ?? 0} />
            <div className="sev-bar-wrap">
              <SevBar label="Critical" count={s.critical_incidents || 0} max={maxSev} color="var(--critical)" />
              <SevBar label="High"     count={s.high_incidents     || 0} max={maxSev} color="var(--high)"     />
              <SevBar label="Medium"   count={s.medium_incidents   || 0} max={maxSev} color="var(--medium)"   />
              <SevBar label="Low"      count={s.low_incidents      || 0} max={maxSev} color="var(--low)"      />
            </div>
          </div>
        </div>

        {/* 🇮🇳 Bharat FinTech & UPI Security Guard */}
        <div className="card">
          <div className="section-title">🇮🇳 Bharat FinTech & UPI Threat Monitor</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-sub)', padding: '12px 14px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px' }}>
                <span>UPI VPA Micro-Debit Velocity</span>
                <span className="badge badge-low">⚡ Auto Shield</span>
              </div>
              <p style={{ color: 'var(--text-sub)', fontSize: '12px', marginTop: 4 }}>
                {livePanels
                  ? `${livePanels.upi_total_events} UPI events monitored · ${livePanels.upi_anomaly_count} anomalies flagged · ${livePanels.upi_blocked_count} VPAs blocked`
                  : 'Monitoring rapid sequential transaction anomalies across UPIVPAs.'}
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-sub)', padding: '12px 14px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px' }}>
                <span>Electricity & Bank SMS Extortion Filter</span>
                <span className="badge badge-info">NLP Active</span>
              </div>
              <p style={{ color: 'var(--text-sub)', fontSize: '12px', marginTop: 4 }}>
                {livePanels
                  ? `${livePanels.nlp_scan_count} messages scanned · ${livePanels.nlp_blocked_count} phishing domains quarantined`
                  : 'Real-time NLP scanning for fake KYC / power disconnection scam links.'}
              </p>
            </div>
          </div>
        </div>

        {/* Explainable AI Risk Model */}
        <div className="card">
          <div className="section-title">🔍 Explainable AI (XAI) Risk Model</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 10, fontSize: '12px' }}>
            {livePanels && livePanels.xai_risk_factors.length > 0
              ? livePanels.xai_risk_factors.map((factor, idx) => {
                  const badgeClass = factor.points >= 30 ? 'badge-critical' : factor.points >= 20 ? 'badge-high' : 'badge-medium'
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-sub)' }}>{factor.reason}</span>
                      <span className={`badge ${badgeClass}`}>+{factor.points} Points</span>
                    </div>
                  )
                })
              : (
                // Fallback to static labels while live data loads
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-sub)' }}>Impossible Travel Speed</span>
                    <span className="badge badge-critical">+38 Points</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-sub)' }}>Failed Password Burst</span>
                    <span className="badge badge-high">+26 Points</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-sub)' }}>UPI Transaction Deviation</span>
                    <span className="badge badge-high">+20 Points</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-sub)' }}>Unusual Tor / ASN IP</span>
                    <span className="badge badge-medium">+16 Points</span>
                  </div>
                </>
              )
            }
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="section-title" style={{ margin: 0 }}>🚨 Live Incident Feed & SOAR Containment Actions</div>
            <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: 2 }}>Click any incident to view MITRE ATT&CK breakdown and AI Detective analysis.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/soc/incidents')} style={{ fontSize: 12 }}>
            View all →
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Risk Score</th>
                <th>Affected User</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="loading-row"><td colSpan={6}>Loading…</td></tr>
              )}
              {!loading && recentIncidents.length === 0 && (
                <tr className="loading-row"><td colSpan={6}>No incidents found</td></tr>
              )}
              {recentIncidents.map(inc => (
                <tr key={inc.id} className="row-link" onClick={() => navigate(`/soc/incidents/${inc.incident_id}`)}>
                  <td className="td-mono">{inc.incident_id}</td>
                  <td style={{ maxWidth: 300, fontWeight: 600 }}>{inc.title}</td>
                  <td><SeverityBadge value={inc.severity} /></td>
                  <td><StatusBadge value={inc.status} /></td>
                  <td>
                    <span className={`risk-score risk-${(inc.severity || 'low').toLowerCase()}`}>{inc.risk_score}</span>
                  </td>
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
