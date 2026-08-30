import { useEffect, useState, useCallback } from 'react'
import { getEvents } from '../api'
import { RiskBadge, AnomalyBadge } from '../components/Badge'
import LiveSOARTerminal from '../components/LiveSOARTerminal'
import { Table, Terminal } from 'lucide-react'

const PAGE_SIZE = 50

function fmt(dt) {
  if (!dt) return '—'
  const utc = dt.endsWith('Z') ? dt : dt + 'Z'
  return new Date(utc).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

export default function Events() {
  const [data, setData] = useState({ items: [], total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [riskLevel, setRiskLevel] = useState('')
  const [eventType, setEventType] = useState('')
  const [isAnomaly, setIsAnomaly] = useState(false)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'terminal'

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, page_size: PAGE_SIZE }
    if (riskLevel) params.risk_level = riskLevel
    if (eventType) params.event_type = eventType
    if (isAnomaly) params.is_anomaly = true
    getEvents(params).then(setData).finally(() => setLoading(false))
  }, [page, riskLevel, eventType, isAnomaly])

  useEffect(() => { load() }, [load])

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Events Feed &amp; Live SOC Stream</h1>
          <p>{data.total} total security events monitored</p>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', background: 'var(--surface-2)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
          <button
            onClick={() => setViewMode('table')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
              background: viewMode === 'table' ? '#3b82f6' : 'transparent',
              color: viewMode === 'table' ? '#fff' : 'var(--text-3)',
              border: 'none', cursor: 'pointer'
            }}
          >
            <Table size={13} />
            <span>Table View</span>
          </button>
          <button
            onClick={() => setViewMode('terminal')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
              background: viewMode === 'terminal' ? '#3b82f6' : 'transparent',
              color: viewMode === 'terminal' ? '#fff' : 'var(--text-3)',
              border: 'none', cursor: 'pointer'
            }}
          >
            <Terminal size={13} />
            <span>Live Terminal Feed</span>
          </button>
        </div>
      </div>

      {viewMode === 'terminal' ? (
        <div style={{ marginTop: 10 }}>
          <LiveSOARTerminal height={520} />
        </div>
      ) : (
        <>
          <div className="filters">
            <select className="filter-select" value={riskLevel} onChange={e => { setRiskLevel(e.target.value); setPage(1) }}>
              <option value="">All risk levels</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select className="filter-select" value={eventType} onChange={e => { setEventType(e.target.value); setPage(1) }}>
              <option value="">All event types</option>
              <option>auth</option>
              <option>access</option>
              <option>network</option>
              <option>file</option>
              <option>process</option>
            </select>
            <button
              className={`toggle-btn${isAnomaly ? ' active' : ''}`}
              onClick={() => { setIsAnomaly(v => !v); setPage(1) }}
            >
              Anomalies only
            </button>
          </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>User</th>
                <th>IP</th>
                <th>Country</th>
                <th>Device</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Score</th>
                <th>Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="loading-row"><td colSpan={10}>Loading…</td></tr>}
              {!loading && data.items.length === 0 && (
                <tr className="loading-row"><td colSpan={10}>No events found</td></tr>
              )}
              {data.items.map(ev => (
                <tr key={ev.id}>
                  <td className="td-mono" style={{ whiteSpace: 'nowrap' }}>{fmt(ev.timestamp)}</td>
                  <td>{ev.event_type}</td>
                  <td className="td-sub">{ev.username}</td>
                  <td className="td-mono">{ev.ip_address || '—'}</td>
                  <td className="td-sub">{ev.country || '—'}</td>
                  <td className="td-sub" style={{ maxWidth: 120 }}>{ev.device || '—'}</td>
                  <td className="td-sub">{ev.login_status || '—'}</td>
                  <td><RiskBadge value={ev.risk_level} /></td>
                  <td><span className={`risk-score risk-${ev.risk_level?.toLowerCase()}`}>{ev.risk_score}</span></td>
                  <td><AnomalyBadge value={ev.is_anomaly} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Page {page} of {totalPages} — {data.total} events</span>
          <div className="pagination-controls">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            })}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  )
}
