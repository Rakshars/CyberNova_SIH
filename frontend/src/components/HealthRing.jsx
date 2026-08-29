export default function HealthRing({ score = 0, size = 110 }) {
  const r      = 40
  const circ   = 2 * Math.PI * r
  const filled = circ * (score / 100)
  const gap    = circ - filled

  const color =
    score >= 75 ? 'var(--green)'  :
    score >= 50 ? 'var(--yellow)' :
    score >= 25 ? 'var(--orange)' :
                  'var(--red)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${gap}`}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)' }}
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="18" fontWeight="700" fontFamily="Inter, sans-serif">
          {score}
        </text>
        <text x="50" y="64" textAnchor="middle"
          fill="var(--text-3)" fontSize="8" fontFamily="Inter, sans-serif">
          / 100
        </text>
      </svg>
      <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>Health Score</span>
    </div>
  )
}
