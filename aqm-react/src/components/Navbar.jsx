import { Sun, Moon, Wind, Wifi, WifiOff } from 'lucide-react'
import { getLabelColor } from '../utils/helpers'

export default function Navbar({ darkMode, onToggleDark, latest, lastUpdated }) {
  const label  = latest?.label || null
  const colors = getLabelColor(label)

  return (
    <nav style={{
      background: 'rgba(10,10,15,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '0 28px',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 200,
    }}>

      {/* Left — logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--blue-dim)',
          border: '1px solid rgba(41,121,255,0.3)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Wind size={16} color="var(--blue-bright)" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            AQM Edge AI
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: -1 }}>
            Indoor Monitor
          </div>
        </div>
      </div>

      {/* Centre — status pill */}
      {label && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '5px 14px',
          background: colors.dim,
          border: `1px solid ${colors.accent}33`,
          borderRadius: 20,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: colors.accent,
            animation: label === 'poor' ? 'pulse-ring 1.5s infinite' : 'none'
          }} />
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: colors.accent,
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            {label}
          </span>
        </div>
      )}

      {/* Right — controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wifi size={13} color="var(--blue)" />
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            aqm-pi-device
          </span>
        </div>
        {lastUpdated && (
          <span style={{
            fontSize: 12, color: 'var(--text-3)',
            fontFamily: 'var(--mono)',
            display: window.innerWidth > 640 ? 'block' : 'none'
          }}>
            {lastUpdated}
          </span>
        )}
        <button
          onClick={onToggleDark}
          style={{
            width: 32, height: 32,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-2)',
            transition: 'border-color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </nav>
  )
}