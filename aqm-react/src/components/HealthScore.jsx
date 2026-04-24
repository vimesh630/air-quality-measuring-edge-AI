import {
  Heart, CheckCircle2, ThumbsUp, Minus, AlertTriangle, AlertOctagon, HelpCircle
} from 'lucide-react'
import { computeHealthScore, getHealthLabel } from '../utils/helpers'
import { useSettingsContext } from '../context/SettingsContext'

// Map icon name string → Lucide component
const ICON_MAP = {
  CheckCircle2,
  ThumbsUp,
  Minus,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
}

export default function HealthScore({ reading }) {
  const { settings } = useSettingsContext()
  const score  = computeHealthScore(reading, settings)
  const info   = getHealthLabel(score)

  // Arc math for score ring (240° span)
  const R       = 42
  const CX      = 54
  const CY      = 54
  const CIRC    = 2 * Math.PI * R
  const pct     = score != null ? score / 100 : 0
  const ARC_PCT = 0.667  // 240° / 360°
  const bgDash  = CIRC * ARC_PCT
  const rotation = 150  // start angle degrees

  const StatusIcon = ICON_MAP[info.icon] || HelpCircle

  const factors = [
    { label: 'AQI Impact', value: reading?.aqi != null ? Math.max(0, 100 - Number(reading.aqi)) : null, color: '#4a6fa5' },
    { label: 'CO₂ Level',  value: reading?.co2_ppm != null ? Math.max(0, 100 - (Number(reading.co2_ppm) - 400) / 16) : null, color: '#3aaa6e' },
    { label: 'Temperature',value: reading?.temperature != null ? Math.max(0, 100 - Math.abs(Number(reading.temperature) - 23) * 10) : null, color: '#c8893a' },
    { label: 'Humidity',   value: reading?.humidity != null ? Math.max(0, 100 - Math.max(0, Math.abs(Number(reading.humidity) - 50) - 10) * 5) : null, color: '#9b7ec8' },
  ]

  return (
    <div className="fade-up glass-card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{
          width: 32, height: 32,
          background: `${info.color}18`,
          border: `1px solid ${info.color}44`,
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Heart size={15} color={info.color} />
        </div>
        <div>
          <div className="card-section-label">Health Impact Score</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Based on all sensor readings</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Ring */}
        <div style={{ flexShrink: 0, position: 'relative', width: 108, height: 108 }}>
          <svg width={108} height={108} viewBox="0 0 108 108">
            <defs>
              <linearGradient id="score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={info.color} stopOpacity={0.6} />
                <stop offset="100%" stopColor={info.color} />
              </linearGradient>
            </defs>
            {/* BG ring */}
            <circle cx={CX} cy={CY} r={R}
              fill="none" stroke="rgba(128,128,160,0.12)" strokeWidth={9}
              strokeDasharray={`${bgDash} ${CIRC}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${CX} ${CY})`}
            />
            {/* Fill ring — smooth animated transition */}
            <circle cx={CX} cy={CY} r={R}
              fill="none" stroke={`url(#score-grad)`} strokeWidth={9}
              strokeDasharray={`${bgDash * pct} ${CIRC}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${CX} ${CY})`}
              style={{
                transition: 'stroke-dasharray 0.95s cubic-bezier(0.25, 0.85, 0.45, 1.0)'
              }}
            />
            {/* Score text */}
            <text x={CX} y={CY - 4} textAnchor="middle" fill={info.color}
              fontSize={22} fontWeight={700} fontFamily="DM Mono, monospace">
              {score ?? '—'}
            </text>
            <text x={CX} y={CY + 12} textAnchor="middle" fill="rgba(128,128,160,0.5)" fontSize={9}>
              /100
            </text>
          </svg>
          {/* Status icon rendered below the ring via absolutely positioned div */}
          <div style={{
            position: 'absolute',
            bottom: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            color: info.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <StatusIcon size={14} />
          </div>
        </div>

        {/* Right — label + factor bars */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: info.color, letterSpacing: '-0.02em', marginBottom: 2 }}>
            {info.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>
            Indoor air health rating
          </div>

          {factors.map(f => {
            const v = f.value != null ? Math.min(100, Math.max(0, f.value)) : 0
            return (
              <div key={f.label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{f.label}</span>
                  <span style={{ fontSize: 10, color: f.color, fontFamily: 'var(--mono)' }}>
                    {f.value != null ? `${Math.round(v)}%` : '—'}
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(128,128,160,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${v}%`,
                    background: `linear-gradient(90deg, ${f.color}88, ${f.color})`,
                    borderRadius: 4,
                    transition: 'width 0.95s cubic-bezier(0.25, 0.85, 0.45, 1.0)'
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}