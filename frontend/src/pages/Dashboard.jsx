import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardSummary, getIncidents } from '../api'
import StatCard from '../components/StatCard'
import HealthRing from '../components/HealthRing'
import { SeverityBadge, StatusBadge } from '../components/Badge'

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

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [recentIncidents, setRecentIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getIncidents({ page: 1, page_size: 5 }),
    ])
      .then(([s, i]) => {
        setSummary(s)
        setRecentIncidents(i.items)
      })
      .finally(() => setLoading(false))
  }, [])

  const s = summary || {}
  const maxSev = Math.max(s.critical_incidents || 0, s.high_incidents || 0, s.medium_incidents || 0, s.low_incidents || 0, 1)

  const severityData = [
    { name: 'Critical', value: s.critical_incidents || 0, color: 'var(--critical)' },
    { name: 'High', value: s.high_incidents || 0, color: 'var(--high)' },
    { name: 'Medium', value: s.medium_incidents || 0, color: 'var(--medium)' },
    { name: 'Low', value: s.low_incidents || 0, color: 'var(--low)' },
  ].filter(d => d.value > 0)

  const anomalyData = [
    { name: 'Anomalies', value: s.total_anomalies || 0, color: 'var(--high)' },
    { name: 'Normal', value: (s.total_events || 0) - (s.total_anomalies || 0), color: 'var(--low)' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Overview</h1>
        <p>Security operations at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <StatCard label="Total Events" value={fmt(s.total_events)} sub={`${fmt(s.events_last_24h)} in last 24h`} />
        <StatCard label="Incidents" value={fmt(s.total_incidents)} sub={`${fmt(s.incidents_last_24h)} in last 24h`} />
        <StatCard label="Open" value={fmt(s.open_incidents)} accent="var(--critical)" />
        <StatCard label="Anomalies" value={fmt(s.total_anomalies)} accent="var(--high)" />
        <StatCard label="Unique Users" value={fmt(s.unique_users)} />
        <StatCard label="Unique IPs" value={fmt(s.unique_ips)} />
      </div>

      {/* Health + Severity */}
      <div className="dash-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Security Health</div>
          <div className="health-wrap">
            <HealthRing score={s.security_health_score ?? 0} />
            <div className="sev-bar-wrap">
              <SevBar label="Critical" count={s.critical_incidents || 0} max={maxSev} color="var(--critical)" />
              <SevBar label="High"     count={s.high_incidents     || 0} max={maxSev} color="var(--high)"     />
              <SevBar label="Medium"   count={s.medium_incidents   || 0} max={maxSev} color="var(--medium)"   />
              <SevBar label="Low"      count={s.low_incidents      || 0} max={maxSev} color="var(--low)"      />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Incident Severity Distribution</div>
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Detection Breakdown</div>
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={anomalyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {anomalyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent incidents */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="section-title" style={{ margin: 0 }}>Recent Incidents</div>
          <button className="btn btn-ghost" onClick={() => navigate('/soc/incidents')} style={{ fontSize: 12, padding: '4px 10px' }}>
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
                <th>Risk</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="loading-row"><td colSpan={6}>Loading…</td></tr>
              )}
              {!loading && recentIncidents.length === 0 && (
                <tr className="loading-row"><td colSpan={6}>No incidents</td></tr>
              )}
              {recentIncidents.map(inc => (
                <tr key={inc.id} className="row-link" onClick={() => navigate(`/soc/incidents/${inc.incident_id}`)}>
                  <td className="td-mono">{inc.incident_id}</td>
                  <td style={{ maxWidth: 260 }}>{inc.title}</td>
                  <td><SeverityBadge value={inc.severity} /></td>
                  <td><StatusBadge value={inc.status} /></td>
                  <td>
                    <span className={`risk-score risk-${inc.severity}`}>{inc.risk_score}</span>
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
