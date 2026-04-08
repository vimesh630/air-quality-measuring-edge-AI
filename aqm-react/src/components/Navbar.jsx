import { Sun, Moon, Wind, Wifi, WifiOff, Settings } from 'lucide-react'
import { getLabelColor } from '../utils/helpers'

export default function Navbar({ darkMode, onToggleDark, latest, lastUpdated, onOpenSettings, connected }) {
  const label  = latest?.label || null
  const colors = getLabelColor(label)

  return (
    <nav style={{
      background: 'var(--bg-elevated)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 28px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 200,
    }}>

      {/* Left — logo + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--blue-dim)',
          border: '1px solid rgba(41,121,255,0.35)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(41,121,255,0.15)'
        }}>
          <Wind size={17} color="var(--blue-bright)" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            AQM Edge AI
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Smart Home Monitor
          </div>
        </div>
      </div>

      {/* Centre — status pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {label && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 16px',
            background: colors.dim,
            border: `1px solid ${colors.accent}33`,
            borderRadius: 24,
            boxShadow: `0 0 14px ${colors.glow || colors.accent + '22'}`,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: colors.accent,
              animation: label === 'poor' ? 'pulse-ring 1.5s infinite' : label === 'good' ? 'pulse-green 2s infinite' : 'none'
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
      </div>

      {/* Right — device + time + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: connected ? '#00e676' : '#ff5252',
            animation: connected ? 'pulse-green 2s infinite' : 'none',
            boxShadow: connected ? '0 0 6px rgba(0,230,118,0.6)' : '0 0 6px rgba(255,82,82,0.6)'
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            aqm-pi-device
          </span>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <span style={{
            fontSize: 11, color: 'var(--text-3)',
            fontFamily: 'var(--mono)',
            display: typeof window !== 'undefined' && window.innerWidth > 640 ? 'block' : 'none'
          }}>
            {lastUpdated}
          </span>
        )}

        {/* Settings button */}
        <button
          id="settings-btn"
          onClick={onOpenSettings}
          title="Open settings"
          style={{
            width: 32, height: 32,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-2)',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(41,121,255,0.4)'
            e.currentTarget.style.background   = 'var(--blue-dim)'
            e.currentTarget.style.color        = 'var(--blue-bright)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.background   = 'var(--bg-elevated)'
            e.currentTarget.style.color        = 'var(--text-2)'
          }}
        >
          <Settings size={14} />
        </button>

        {/* Dark/light toggle */}
        <button
          id="dark-mode-toggle"
          onClick={onToggleDark}
          title="Toggle dark/light mode"
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
