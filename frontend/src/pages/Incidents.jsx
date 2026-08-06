import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIncidents } from '../api'
import { SeverityBadge, StatusBadge } from '../components/Badge'

const PAGE_SIZE = 20

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

export default function Incidents() {
  const [data, setData] = useState({ items: [], total: 0 })
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(true)
  const [severity, setSeverity] = useState('')
  const [status,   setStatus]   = useState('')
  const [username, setUsername] = useState('')
  const navigate = useNavigate()

  const load = useCallback(() => {
    setLoading(true)
    getIncidents({ page, page_size: PAGE_SIZE, severity, status, username })
      .then(setData)
      .finally(() => setLoading(false))
  }, [page, severity, status, username])

  useEffect(() => { load() }, [load])

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))

  function handleFilter() {
    setPage(1)
    // useEffect will re-run because page may stay 1 — force via load
    load()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Incidents</h1>
        <p>{data.total} total incidents</p>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          id="filter-username"
          className="filter-input"
          placeholder="Filter by username…"
          value={username}
          onChange={e => { setUsername(e.target.value); setPage(1) }}
        />
        <select
          id="filter-severity"
          className="filter-select"
          value={severity}
          onChange={e => { setSeverity(e.target.value); setPage(1) }}
        >
          <option value="">All severities</option>
          <option>critical</option>
          <option>high</option>
          <option>medium</option>
          <option>low</option>
        </select>
        <select
          id="filter-status"
          className="filter-select"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">All statuses</option>
          <option>open</option>
          <option>investigating</option>
          <option>contained</option>
          <option>closed</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Risk</th>
                <th>User</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="loading-row"><td colSpan={8}>Loading…</td></tr>}
              {!loading && data.items.length === 0 && (
                <tr className="loading-row"><td colSpan={8}>No incidents found</td></tr>
              )}
              {data.items.map(inc => (
                <tr
                  key={inc.id}
                  className="row-link"
                  onClick={() => navigate(`/soc/incidents/${inc.incident_id}`)}
                >
                  <td className="td-mono">{inc.incident_id}</td>
                  <td style={{ maxWidth: 240 }}>{inc.title}</td>
                  <td className="td-sub">{inc.incident_type || '—'}</td>
                  <td><SeverityBadge value={inc.severity} /></td>
                  <td><StatusBadge value={inc.status} /></td>
                  <td>
                    <span className={`risk-score risk-${inc.severity}`}>{inc.risk_score}</span>
                  </td>
                  <td className="td-sub">{inc.affected_username || '—'}</td>
                  <td className="td-sub">{formatDate(inc.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination" style={{ padding: '14px 16px' }}>
          <span className="pagination-info">
            Page {page} of {totalPages} — {data.total} incidents
          </span>
          <div className="pagination-controls">
            <button
              id="prev-page"
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button
                  key={p}
                  className={`page-btn${p === page ? ' active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            })}
            <button
              id="next-page"
              className="page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
