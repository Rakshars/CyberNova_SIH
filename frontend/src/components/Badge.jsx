const SEVERITY_CLASS = {
  critical: 'badge-critical',
  high:     'badge-high',
  medium:   'badge-medium',
  low:      'badge-low',
}

const STATUS_CLASS = {
  open:          'badge-critical',
  investigating: 'badge-high',
  contained:     'badge-medium',
  closed:        'badge-neutral',
}

const RISK_CLASS = {
  Critical: 'badge-critical',
  High:     'badge-high',
  Medium:   'badge-medium',
  Low:      'badge-low',
}

export function SeverityBadge({ value }) {
  const cls = SEVERITY_CLASS[value?.toLowerCase()] || 'badge-neutral'
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {value}
    </span>
  )
}

export function StatusBadge({ value }) {
  const cls = STATUS_CLASS[value?.toLowerCase()] || 'badge-neutral'
  return <span className={`badge ${cls}`}>{value}</span>
}

export function RiskBadge({ value }) {
  const cls = RISK_CLASS[value] || 'badge-neutral'
  return <span className={`badge ${cls}`}>{value}</span>
}

export function AnomalyBadge({ value }) {
  return value
    ? <span className="badge badge-critical">Anomaly</span>
    : <span className="badge badge-neutral">Normal</span>
}
