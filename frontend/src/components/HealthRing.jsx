/* HealthRing — SVG circular progress ring */

export default function HealthRing({ score = 0, size = 110 }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const filled = circ * (score / 100)
  const gap = circ - filled

  const color =
    score >= 75 ? 'var(--low)' :
    score >= 50 ? 'var(--medium)' :
    score >= 25 ? 'var(--high)' :
                  'var(--critical)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* Track */}
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth="8"
        />
        {/* Fill */}
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
        {/* Score text */}
        <text
          x="50" y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize="18"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          {score}
        </text>
        <text
          x="50" y="64"
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize="8"
          fontFamily="Inter, sans-serif"
        >
          / 100
        </text>
      </svg>
      <span style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 500 }}>
        Health Score
      </span>
    </div>
  )
}
