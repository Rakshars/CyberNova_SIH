/* StatCard */

export default function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card" style={accent ? { borderTop: `2px solid ${accent}` } : {}}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: accent } : {}}>{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
