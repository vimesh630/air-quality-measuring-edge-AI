import { useState } from 'react'
import axios from 'axios'
import { RefreshCw, Clock, ChevronRight, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DeviceControl({ darkMode = true }) {
  const [activeInterval, setActiveInterval] = useState(2)
  const [sending,        setSending]        = useState(false)

  const sendCommand = async (action, value = null) => {
    setSending(true)
    try {
      const res = await axios.post('/api/command', { action, value })
      if (res.data.success) {
        toast.success(`Command sent: ${action}`, {
          style: {
            background: '#111118',
            color: '#f0f0f8',
            border: '1px solid rgba(41,121,255,0.3)',
            fontFamily: "'DM Sans', sans-serif"
          }
        })
      } else {
        toast.error(`Failed: ${res.data.error}`)
      }
    } catch {
      toast.error('Could not reach device')
    } finally {
      setSending(false)
    }
  }

  const setInterval_ = (s) => {
    setActiveInterval(s)
    sendCommand('set_interval', s)
  }

  const intervalBtn = (s) => ({
    fontSize: 12,
    fontWeight: activeInterval === s ? 700 : 400,
    fontFamily: 'var(--mono)',
    padding: '6px 14px',
    borderRadius: 6,
    border: `1px solid ${activeInterval === s ? 'var(--blue)' : 'var(--border)'}`,
    background: activeInterval === s ? 'var(--blue-dim)' : 'transparent',
    color: activeInterval === s ? 'var(--blue-bright)' : 'var(--text-3)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    opacity: sending ? 0.5 : 1
  })

  const CommandRow = ({ icon: Icon, iconColor, label, children }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 28, height: 28,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={13} color={iconColor || 'var(--text-3)'} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{label}</span>
      {children}
    </div>
  )

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
      <div style={{
        fontSize: 12, fontWeight: 600,
        color: 'var(--text-3)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 16
      }}>
        Device Control
      </div>

      {/* Sampling interval */}
      <CommandRow icon={Clock} label="Sampling interval">
        <div style={{ display: 'flex', gap: 6 }}>
          {[2, 5, 10].map(s => (
            <button key={s} style={intervalBtn(s)}
              onClick={() => setInterval_(s)} disabled={sending}>
              {s}s
            </button>
          ))}
        </div>
      </CommandRow>

      {/* Manual read — blue */}
      <CommandRow icon={RefreshCw} label="Trigger manual reading">
        <button
          onClick={() => sendCommand('read_now')}
          disabled={sending}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600,
            padding: '6px 14px', borderRadius: 6,
            border: '1px solid var(--blue)',
            background: 'var(--blue-dim)',
            color: 'var(--blue-bright)',
            cursor: 'pointer',
            opacity: sending ? 0.5 : 1,
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => !sending && (e.currentTarget.style.background = 'rgba(41,121,255,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--blue-dim)')}
        >
          Read now <ChevronRight size={12} />
        </button>
      </CommandRow>

      {/* Retrain — amber, clearly distinct from other buttons */}
      <CommandRow icon={RotateCcw} iconColor="#ffab40" label="Retrain on-device ML model">
        <button
          onClick={() => sendCommand('retrain')}
          disabled={sending}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 700,
            padding: '6px 16px', borderRadius: 6,
            border: '1px solid rgba(255,171,64,0.6)',
            background: 'rgba(255,171,64,0.1)',
            color: '#ffab40',
            cursor: 'pointer',
            opacity: sending ? 0.5 : 1,
            transition: 'all 0.15s',
            letterSpacing: '0.02em'
          }}
          onMouseEnter={e => {
            if (!sending) {
              e.currentTarget.style.background   = darkMode ? 'rgba(255,171,64,0.2)' : 'rgba(255,171,64,0.15)'
              e.currentTarget.style.borderColor  = '#ffab40'
              e.currentTarget.style.boxShadow    = darkMode ? '0 0 12px rgba(255,171,64,0.2)' : '0 2px 6px rgba(0,0,0,0.05)'
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'rgba(255,171,64,0.1)'
            e.currentTarget.style.borderColor = 'rgba(255,171,64,0.6)'
            e.currentTarget.style.boxShadow   = 'none'
          }}
        >
          <RotateCcw size={12} />
          Retrain
        </button>
      </CommandRow>

      <div style={{ height: 4 }} />
    </div>
  )
}