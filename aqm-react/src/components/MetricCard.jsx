import { useEffect, useRef, useState } from 'react'

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  const startRef = useRef(null)
  const rafRef   = useRef(null)

  useEffect(() => {
    if (target == null || isNaN(Number(target))) { setValue(target); return }
    const end = Number(target)
    const start = performance.now()
    startRef.current = start

    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(ease * end * 10) / 10
      setValue(current)
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

export default function MetricCard({ label, value, unit, accent, sublabel, raw, darkMode = true }) {
  // Animate numeric values
  const numericRaw = raw != null ? Number(raw) : (value !== '--' ? Number(value) : null)
  const animated   = useCountUp(numericRaw)
  const displayVal = (numericRaw != null && !isNaN(numericRaw))
    ? (numericRaw % 1 !== 0 ? animated.toFixed(1) : Math.round(animated))
    : value

  return (
    <div
      className="fade-up glass-card"
      style={{
        cursor: 'default',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = (accent || 'var(--border-mid)')
        e.currentTarget.style.transform   = 'translateY(-2px)'
        e.currentTarget.style.boxShadow   = darkMode
          ? `var(--shadow-card), 0 0 20px ${accent || 'rgba(41,121,255,0.15)'}66`
          : '0 12px 30px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.03)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform   = 'translateY(0)'
        e.currentTarget.style.boxShadow   = 'var(--shadow-card)'
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent || 'var(--blue)'}, transparent)`,
        opacity: 0.7,
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80,
        background: darkMode 
          ? `radial-gradient(circle at top right, ${accent || 'var(--blue)'}15, transparent 70%)`
          : 'transparent',
        borderRadius: '0 16px 0 0',
        pointerEvents: 'none'
      }} />

      <div style={{
        fontSize: 11, fontWeight: 600,
        color: 'var(--text-3)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 12
      }}>
        {label}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: 38, fontWeight: 700,
          color: 'var(--text-1)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontFamily: 'var(--mono)'
        }}>
          {displayVal}
        </span>
        {unit && (
          <span style={{
            fontSize: 15, fontWeight: 400,
            color: 'var(--text-3)',
            letterSpacing: '0.02em'
          }}>
            {unit}
          </span>
        )}
      </div>

      {sublabel && (
        <div style={{
          fontSize: 11, color: accent || 'var(--blue-bright)',
          marginTop: 8, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 5
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: accent || 'var(--blue-bright)',
          }} />
          {sublabel}
        </div>
      )}
    </div>
  )
}