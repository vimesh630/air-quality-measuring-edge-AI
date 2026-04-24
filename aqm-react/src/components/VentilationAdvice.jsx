import {
  DoorOpen, AirVent, CheckCircle2, Siren, Wind, AlertTriangle,
  CloudOff, Snowflake, Flame, Droplets, Droplet
} from 'lucide-react'
import { useSettingsContext } from '../context/SettingsContext'
import { getVentilationAdvice } from '../utils/helpers'

// Map icon name string → Lucide component
const ICON_MAP = {
  DoorOpen,
  AirVent,
  CheckCircle2,
  Siren,
  Wind,
  AlertTriangle,
  CloudOff,
  Snowflake,
  Flame,
  Droplets,
  Droplet,
}

const priorityConfig = {
  high:   { bg: 'rgba(192,85,85,0.07)',    border: 'rgba(192,85,85,0.18)',    dot: '#c05555' },
  medium: { bg: 'rgba(200,137,58,0.07)',   border: 'rgba(200,137,58,0.18)',   dot: '#c8893a' },
  low:    { bg: 'rgba(58,170,110,0.06)',   border: 'rgba(58,170,110,0.14)',   dot: '#3aaa6e' },
}

export default function VentilationAdvice({ reading }) {
  const { settings } = useSettingsContext()
  const advice = getVentilationAdvice(reading, settings)

  return (
    <div className="fade-up glass-card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32,
          background: 'rgba(58, 156, 181, 0.15)', /* muted cyan */
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Wind size={15} color="var(--cyan)" />
        </div>
        <div>
          <div className="card-section-label">Ventilation Advice</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Smart home recommendations</div>
        </div>
      </div>

      {/* Advice list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {advice.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
            Waiting for sensor data…
          </div>
        ) : advice.map((a, i) => {
          const cfg = priorityConfig[a.priority]
          const IconComp = ICON_MAP[a.icon]
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
            >
              {/* Priority dot */}
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: cfg.dot, flexShrink: 0,
              }} />
              {/* Lucide Icon */}
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: a.color }}>
                {IconComp ? <IconComp size={15} /> : null}
              </div>
              {/* Text */}
              <span style={{ fontSize: 12, color: a.color, fontWeight: a.priority === 'high' ? 600 : 400, flex: 1 }}>
                {a.text}
              </span>
              {/* Priority badge */}
              <span style={{
                fontSize: 10, fontWeight: 600,
                padding: '2px 6px', borderRadius: 4,
                background: cfg.dot + '20',
                color: cfg.dot,
                textTransform: 'capitalize',
                flexShrink: 0
              }}>
                {a.priority}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: 14, fontSize: 10,
        color: 'var(--text-4)', fontStyle: 'italic'
      }}>
        Recommendations update automatically with each sensor reading.
      </div>
    </div>
  )
}