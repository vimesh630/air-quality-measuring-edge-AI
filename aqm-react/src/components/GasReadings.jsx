import { getGasStatus, formatPPM } from '../utils/helpers'
import { Flame, AlertTriangle } from 'lucide-react'

const GasCard = ({ name, formula, value, unit, safe, warn }) => {
  const numVal = value != null ? Number(value) : null
  const status = getGasStatus(numVal, safe, warn)

  const pct = numVal != null
    ? Math.min(100, (numVal / (warn * 2)) * 100)
    : 0

  // Gradient based on status
  const gradColor = status.label === 'Safe'      ? '#00e676'
                  : status.label === 'Elevated'  ? '#ffab40'
                  : status.label === 'Dangerous' ? '#ff5252'
                  : '#8888aa'

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '16px 18px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s, background-color 0.2s',
        cursor: 'default'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = status.color + '55'
        e.currentTarget.style.backgroundColor = 'var(--bg-glass)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
      }}
    >

      {/* Formula + status badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{
            fontSize: 17, fontWeight: 800,
            color: 'var(--text-1)',
            letterSpacing: '-0.01em',
            fontFamily: 'var(--mono)',
            lineHeight: 1
          }}>
            {formula}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{name}</div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600,
          padding: '3px 8px',
          borderRadius: 6,
          background: status.dim,
          color: status.color,
          textTransform: 'capitalize'
        }}>
          {status.label}
        </div>
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14 }}>
        <span style={{
          fontSize: 32, fontWeight: 700,
          color: status.label === '--' ? 'var(--text-3)' : status.color,
          letterSpacing: '-0.03em',
          fontFamily: 'var(--mono)',
          lineHeight: 1,
          transition: 'color 0.3s'
        }}>
          {formatPPM(numVal)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{unit}</span>
      </div>

      {/* Gradient progress bar */}
      <div style={{
        height: 4,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 8
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${gradColor}88, ${gradColor})`,
          borderRadius: 2,
          transition: 'width 0.95s cubic-bezier(0.25, 0.85, 0.45, 1.0)'
        }} />
      </div>

      {/* Threshold labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          Safe ≤{safe}
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          Warn ≤{warn}
        </span>
      </div>
    </div>
  )
}

export default function GasReadings({ latest }) {
  const gases = [
    {
      name:    'Carbon Dioxide',
      formula: 'CO₂',
      value:   latest?.co2_ppm,
      unit:    'ppm',
      safe:    1000,
      warn:    2000,
    },
    {
      name:    'Carbon Monoxide',
      formula: 'CO',
      value:   latest?.co_ppm,
      unit:    'ppm',
      safe:    9,
      warn:    35,
    },
    {
      name:    'Ammonia',
      formula: 'NH₃',
      value:   latest?.nh3_ppm,
      unit:    'ppm',
      safe:    25,
      warn:    50,
    }
  ]

  return (
    <div
      className="fade-up glass-card"
      style={{ marginTop: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{
          width: 32, height: 32,
          background: 'rgba(10, 132, 255, 0.15)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Flame size={15} color="var(--blue-bright)" />
        </div>
        <div>
          <div className="card-section-label">Gas Concentrations</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
            MQ-135 sensor estimates
          </div>
        </div>
      </div>

      <div className="gas-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {gases.map(g => <GasCard key={g.formula} {...g} />)}
      </div>

      <div style={{
        marginTop: 14,
        fontSize: 11,
        color: 'var(--text-3)',
        fontStyle: 'italic',
        lineHeight: 1.6,
        paddingTop: 12,
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6
      }}>
        <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--amber, #ffab40)' }} />
        <span>Values are approximate estimates based on MQ-135 sensitivity curves. Sensor calibration improves accuracy.</span>
      </div>
    </div>
  )
}
