import { getLabelColor, formatTime, formatTemp, formatHum, formatAQI } from '../utils/helpers'
import { Download } from 'lucide-react'

function exportCSV(readings) {
  if (!readings.length) return
  const headers = ['Time', 'Temperature (°C)', 'Humidity (%)', 'AQI', 'CO2 (ppm)', 'CO (ppm)', 'NH3 (ppm)', 'Label', 'Confidence', 'Alert']
  const rows = readings.map(r => [
    r.timestamp,
    r.temperature?.toFixed(1) ?? '',
    r.humidity?.toFixed(1) ?? '',
    r.aqi?.toFixed(1) ?? '',
    r.co2_ppm?.toFixed(1) ?? '',
    r.co_ppm?.toFixed(1) ?? '',
    r.nh3_ppm?.toFixed(1) ?? '',
    r.label ?? '',
    r.confidence != null ? (r.confidence * 100).toFixed(1) + '%' : '',
    r.is_alert ? 'Yes' : 'No'
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aqm-readings-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReadingsTable({ readings }) {
  const headers = ['Date / Time', 'Temp', 'Hum', 'AQI', 'Label']

  return (
    <div className="fade-up glass-card" style={{ overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="card-section-label" style={{ marginBottom: 2 }}>Recent Readings</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Latest 10 sensor logs</div>
        </div>
        <button
          onClick={() => exportCSV(readings)}
          title="Export as CSV"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 7,
            background: 'rgba(41,121,255,0.08)',
            border: '1px solid rgba(41,121,255,0.2)',
            color: 'var(--blue-bright)',
            fontSize: 11, fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--blue-dim)'
            e.currentTarget.style.borderColor = 'rgba(41,121,255,0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(41,121,255,0.08)'
            e.currentTarget.style.borderColor = 'rgba(41,121,255,0.2)'
          }}
        >
          <Download size={11} /> Export CSV
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: 'left',
                padding: '0 8px 10px 8px',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-3)',
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
                padding: '32px 8px',
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
              const isAlert = r.is_alert

              return (
                <tr
                  key={i}
                  style={{
                    transition: 'background 0.1s',
                    background: isAlert ? 'rgba(255,82,82,0.04)' : 'transparent',
                    borderLeft: isAlert ? '2px solid rgba(255,82,82,0.4)' : '2px solid transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isAlert ? 'rgba(255,82,82,0.07)' : 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = isAlert ? 'rgba(255,82,82,0.04)' : 'transparent'}
                >
                  <td style={{ padding: '8px 8px', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', borderBottom: '1px solid rgba(128,128,160,0.06)', whiteSpace: 'nowrap' }}>
                    {formatTime(r.timestamp)}
                  </td>
                  <td style={{ padding: '8px 8px', fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--mono)', borderBottom: '1px solid var(--border)' }}>
                    {formatTemp(r.temperature)}°
                  </td>
                  <td style={{ padding: '8px 8px', fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--mono)', borderBottom: '1px solid var(--border)' }}>
                    {formatHum(r.humidity)}%
                  </td>
                  <td style={{ padding: '8px 8px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)',
                      color: colors.accent
                    }}>
                      {formatAQI(r.aqi)}
                    </span>
                  </td>
                  <td style={{ padding: '8px 8px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 8px',
                      borderRadius: 5,
                      background: colors.dim,
                      color: colors.accent,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.accent, flexShrink: 0 }} />
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