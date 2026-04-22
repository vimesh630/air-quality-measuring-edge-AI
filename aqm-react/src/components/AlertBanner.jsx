import { AlertTriangle, X } from 'lucide-react'
import { formatTime } from '../utils/helpers'
import { useState } from 'react'

export default function AlertBanner({ latest }) {
  const [dismissed, setDismissed] = useState(false)

  if (!latest?.is_alert || dismissed) return null

  return (
    <div style={{
      background: 'rgba(255,82,82,0.08)',
      borderBottom: '1px solid rgba(255,82,82,0.2)',
      padding: '10px 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 28, height: 28,
        background: 'rgba(255,82,82,0.15)',
        border: '1px solid rgba(255,82,82,0.3)',
        borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <AlertTriangle size={14} color="#ff5252" />
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#ff5252' }}>
          ALERT —{' '}
        </span>
        <span style={{ fontSize: 13, color: 'rgba(255,82,82,0.8)' }}>
          Poor air quality detected. AQI {Number(latest.aqi).toFixed(1)}.
          Open windows and ventilate immediately.
        </span>
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,82,82,0.5)', fontFamily: 'var(--mono)', flexShrink: 0 }}>
        {formatTime(latest.timestamp)}
      </span>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,82,82,0.5)', padding: 4, display: 'flex' }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
