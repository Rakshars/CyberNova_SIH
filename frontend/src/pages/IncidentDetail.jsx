import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getIncident, getIncidentTimeline, submitFeedback } from '../api'
import { SeverityBadge, StatusBadge, AnomalyBadge } from '../components/Badge'

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function Kv({ k, v }) {
  return (
    <div className="kv-row">
      <span className="kv-key">{k}</span>
      <span className="kv-val">{v || '—'}</span>
    </div>
  )
}

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [inc, setInc] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [showTimeline, setShowTimeline] = useState(false)
  const [verdict, setVerdict] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getIncident(id)
      .then(data => {
        setInc(data)
        if (data.analyst_verdict) setVerdict(data.analyst_verdict)
        if (data.analyst_notes)   setNotes(data.analyst_notes)
      })
      .finally(() => setLoading(false))
  }, [id])

  function loadTimeline() {
    if (timeline.length > 0) { setShowTimeline(v => !v); return }
    getIncidentTimeline(id).then(events => {
      setTimeline(events)
      setShowTimeline(true)
    })
  }

  async function handleFeedback(e) {
    e.preventDefault()
    if (!verdict) return
    setSubmitting(true)
    try {
      const updated = await submitFeedback(id, { verdict, notes })
      setInc(updated)
      setToast(true)
      setTimeout(() => setToast(false), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="empty-state">Loading incident…</div>
  }

  if (!inc) {
    return <div className="empty-state">Incident not found.</div>
  }

  const mitres = inc.mitre_techniques || []
  const responses = inc.response_taken || []
  const investigation = inc.investigation || {}

  return (
    <div>
      {/* Header */}
      <div className="detail-header">
        <div>
          <div className="detail-meta" style={{ marginBottom: 8 }}>
            <span className="detail-id">{inc.incident_id}</span>
            <SeverityBadge value={inc.severity} />
            <StatusBadge   value={inc.status} />
          </div>
          <div className="detail-title">{inc.title}</div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {/* Summary */}
      {inc.summary && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 8 }}>Summary</div>
          <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7 }}>{inc.summary}</p>
        </div>
      )}

      {/* Key info grid */}
      <div className="detail-grid">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Incident Info</div>
          <div className="kv-list">
            <Kv k="Type"       v={inc.incident_type} />
            <Kv k="Risk Score" v={inc.risk_score} />
            <Kv k="Confidence" v={inc.confidence != null ? (inc.confidence * 100).toFixed(0) + '%' : null} />
            <Kv k="Events"     v={inc.event_count} />
            <Kv k="Start"      v={fmt(inc.start_time)} />
            <Kv k="End"        v={fmt(inc.end_time)} />
            <Kv k="Created"    v={fmt(inc.created_at)} />
          </div>
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Affected</div>
          <div className="kv-list">
            <Kv k="User"   v={inc.affected_username} />
            <Kv k="IP"     v={inc.affected_ip} />
            <Kv k="Device" v={inc.affected_device} />
            {inc.analyst_verdict && (
              <Kv k="Verdict" v={inc.analyst_verdict} />
            )}
          </div>
          {investigation && Object.keys(investigation).length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: 16, marginBottom: 12 }}>Investigation</div>
              <div className="kv-list">
                {Object.entries(investigation).slice(0, 4).map(([k, v]) => (
                  <Kv key={k} k={k.replace(/_/g, ' ')} v={typeof v === 'object' ? JSON.stringify(v) : String(v)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MITRE */}
      {mitres.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>MITRE ATT&amp;CK</div>
          <div className="mitre-list">
            {mitres.map((t, i) => (
              <div key={i} className="mitre-chip">
                <strong>{t.id || t.technique_id}</strong>
                {' '}
                {t.name || t.technique_name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response */}
      {responses.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Response Actions</div>
          <div className="response-list">
            {responses.map((r, i) => (
              <div key={i} className="response-item">
                {typeof r === 'string' ? r : r.action || r.description || JSON.stringify(r)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div
          id="toggle-timeline"
          className={`timeline-toggle${showTimeline ? ' open' : ''}`}
          onClick={loadTimeline}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Event Timeline ({inc.event_count} events)
        </div>
        {showTimeline && (
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Type</th>
                  <th>User</th>
                  <th>IP</th>
                  <th>Country</th>
                  <th>Risk</th>
                  <th>Anomaly</th>
                </tr>
              </thead>
              <tbody>
                {timeline.length === 0 && (
                  <tr className="loading-row"><td colSpan={7}>Loading…</td></tr>
                )}
                {timeline.map(ev => (
                  <tr key={ev.id}>
                    <td className="td-mono">{fmt(ev.timestamp)}</td>
                    <td>{ev.event_type}</td>
                    <td className="td-sub">{ev.username}</td>
                    <td className="td-mono">{ev.ip_address}</td>
                    <td className="td-sub">{ev.country}</td>
                    <td>
                      <span className={`risk-score risk-${ev.risk_level?.toLowerCase()}`}>{ev.risk_score}</span>
                    </td>
                    <td><AnomalyBadge value={ev.is_anomaly} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analyst Feedback */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 14 }}>Analyst Verdict</div>
        <form className="feedback-form" onSubmit={handleFeedback}>
          <div className="verdict-options">
            {['true_positive', 'false_positive', 'needs_investigation'].map(v => (
              <button
                key={v}
                type="button"
                className={`verdict-btn${verdict === v ? ' selected' : ''}`}
                onClick={() => setVerdict(v)}
              >
                {v.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <textarea
            className="feedback-textarea"
            placeholder="Analyst notes (optional)…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <div>
            <button
              id="submit-feedback"
              type="submit"
              className="btn btn-primary"
              disabled={!verdict || submitting}
            >
              {submitting ? 'Saving…' : 'Save Verdict'}
            </button>
          </div>
        </form>
      </div>

      {toast && <div className="toast">✓ Verdict saved</div>}
    </div>
  )
}
