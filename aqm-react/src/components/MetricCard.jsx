export default function MetricCard({ label, value, unit, accent, sublabel }) {
  return (
    <div
      className="fade-up"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accent || 'var(--border-mid)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Accent line at top */}
      <div style={{
        position: 'absolute', top: 0, left: 22, right: 22, height: 2,
        background: accent || 'var(--blue)',
        borderRadius: '0 0 2px 2px',
        opacity: 0.6
      }} />

      <div style={{
        fontSize: 12, fontWeight: 600,
        color: 'var(--text-3)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 10
      }}>
        {label}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: 36, fontWeight: 700,
          color: 'var(--text-1)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontFamily: 'var(--mono)'
        }}>
          {value}
        </span>
        {unit && (
          <span style={{
            fontSize: 14, fontWeight: 400,
            color: 'var(--text-3)',
            letterSpacing: '0.02em'
          }}>
            {unit}
          </span>
        )}
      </div>

      {sublabel && (
        <div style={{
          fontSize: 11, color: accent || 'var(--blue)',
          marginTop: 6, fontWeight: 500
        }}>
          {sublabel}
        </div>
      )}
    </div>
  )
}