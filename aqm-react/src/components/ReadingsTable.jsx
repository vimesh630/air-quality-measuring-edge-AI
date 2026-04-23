import { getLabelColor, formatTime, formatTemp, formatHum, formatAQI } from '../utils/helpers'

export default function ReadingsTable({ readings }) {
  const headers = ['Time', 'Temp', 'Hum', 'AQI', 'Label']

  return (
    <div
      className="fade-up"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '20px 22px',
        overflow: 'hidden'
      }}
    >
      <div style={{
        fontSize: 12, fontWeight: 600,
        color: 'var(--text-3)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 16
      }}>
        Recent Readings
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: 'left',
                padding: '0 8px 10px 8px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-3)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderBottom: '1px solid var(--border)'
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {readings.length === 0 ? (
            <tr>
              <td colSpan={5} style={{
                textAlign: 'center',
                padding: '24px 8px',
                fontSize: 12,
                color: 'var(--text-3)',
                fontFamily: 'var(--mono)'
              }}>
                No readings yet
              </td>
            </tr>
          ) : (
            readings.slice(0, 10).map((r, i) => {
              const colors = getLabelColor(r.label)
              return (
                <tr
                  key={i}
                  style={{ transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '9px 8px', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {formatTime(r.timestamp)}
                  </td>
                  <td style={{ padding: '9px 8px', fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--mono)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {formatTemp(r.temperature)}°
                  </td>
                  <td style={{ padding: '9px 8px', fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--mono)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {formatHum(r.humidity)}%
                  </td>
                  <td style={{ padding: '9px 8px', fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--mono)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {formatAQI(r.aqi)}
                  </td>
                  <td style={{ padding: '9px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '2px 8px',
                      borderRadius: 5,
                      background: colors.dim,
                      color: colors.accent,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      <span style={{
                        width: 5, height: 5,
                        borderRadius: '50%',
                        background: colors.accent,
                        flexShrink: 0
                      }} />
                      {r.label || '--'}
                    </span>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}