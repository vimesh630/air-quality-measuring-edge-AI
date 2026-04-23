import { getGasStatus, formatPPM } from '../utils/helpers'
import { Flame } from 'lucide-react'

const GasCard = ({ name, formula, value, unit, safe, warn, desc }) => {
  const numVal = value != null ? Number(value) : null
  const status = getGasStatus(numVal, safe, warn)

  const pct = numVal != null
    ? Math.min(100, (numVal / (warn * 2)) * 100)
    : 0

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = status.color + '44'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 60, height: 60,
        background: status.dim,
        borderRadius: '0 12px 0 60px',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{
            fontSize: 16, fontWeight: 700,
            color: 'var(--text-1)',
            letterSpacing: '-0.01em',
            fontFamily: 'var(--mono)'
          }}>
            {formula}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{name}</div>
        </div>
        <div style={{
          fontSize: 12, fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 6,
          background: status.dim,
          color: status.color,
          letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}>
          {status.label}
        </div>
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
        <span style={{
          fontSize: 28, fontWeight: 700,
          color: status.label === '--' ? 'var(--text-3)' : status.color,
          letterSpacing: '-0.03em',
          fontFamily: 'var(--mono)',
          lineHeight: 1
        }}>
          {formatPPM(numVal)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{unit}</span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 3,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 8
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: status.color,
          borderRadius: 2,
          transition: 'width 0.8s ease, background 0.3s ease',
          opacity: 0.8
        }} />
      </div>

      {/* Thresholds */}
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
      className="fade-up"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '20px 22px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{
          width: 30, height: 30,
          background: 'rgba(41,121,255,0.1)',
          border: '1px solid rgba(41,121,255,0.2)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Flame size={14} color="var(--blue-bright)" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Gas Concentrations
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
            MQ-135 sensor estimates
          </div>
        </div>
      </div>

      <div className="gas-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {gases.map(g => <GasCard key={g.formula} {...g} />)}
      </div>

      <div style={{
        marginTop: 12,
        fontSize: 12,
        color: 'var(--text-3)',
        fontStyle: 'italic',
        lineHeight: 1.5
      }}>
        Values are approximate estimates based on MQ-135 sensitivity curves.
        Calibration improves accuracy.
      </div>
    </div>
  )
}