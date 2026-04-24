import { aqiCategory } from '../utils/helpers'
import { useSettingsContext } from '../context/SettingsContext'

const polar = (cx, cy, r, angleDeg) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const arcD = (cx, cy, r, startDeg, endDeg) => {
  if (Math.abs(endDeg - startDeg) < 0.01) return ''
  const s     = polar(cx, cy, r, startDeg)
  const e     = polar(cx, cy, r, endDeg)
  const large = (endDeg - startDeg) > 180 ? 1 : 0
  return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`
}

const ARC_START =  -130
const ARC_END   =   130
const ARC_SPAN  = ARC_END - ARC_START   // 260°

const AQI_MAX = 100
const CX      = 100
const CY      = 104
const R_TRACK =  72

// Non-overshooting smooth ease-out cubic — no spring bounce
const EASE = 'cubic-bezier(0.25, 0.85, 0.45, 1.0)'
const DURATION = '0.95s'

export default function AQIGauge({ value, darkMode = true }) {
  const { settings } = useSettingsContext();
  const aqi  = value != null ? Math.min(AQI_MAX, Math.max(0, Number(value))) : null
  const cat  = aqiCategory(aqi, settings)
  const pct  = aqi != null ? aqi / AQI_MAX : 0

  // Compute total arc length for stroke-dasharray drawing
  const arcLength = 2 * Math.PI * R_TRACK * (ARC_SPAN / 360)

  // Needle rotation in degrees (relative to SVG vertical = 0°)
  // At pct=0  → ARC_START° = -130° from top
  // At pct=1  → ARC_END°   = +130° from top
  // CSS rotate around (CX, CY): we offset by the arc start so 0% → 0deg CSS
  const needleDeg   = ARC_START + ARC_SPAN * pct   // -130 … +130

  const angleAt = (v) => ARC_START + ARC_SPAN * (v / AQI_MAX)

  const scalePts = [
    { a: ARC_START,                   lbl: '0'   },
    { a: ARC_START + ARC_SPAN * 0.25, lbl: '25'  },
    { a: ARC_START + ARC_SPAN * 0.5,  lbl: '50'  },
    { a: ARC_START + ARC_SPAN * 0.75, lbl: '75'  },
    { a: ARC_END,                     lbl: '100' },
  ]

  const labelColor   = darkMode ? 'rgba(160,160,190,0.55)' : 'rgba(80,80,110,0.75)'
  const trackColor   = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)'
  const needleColor  = darkMode ? 'rgba(240,240,255,0.88)' : 'rgba(20,20,40,0.75)'
  const aqiLabelFill = darkMode ? 'rgba(160,160,190,0.45)' : 'rgba(60,60,100,0.55)'

  return (
    <div className="fade-up glass-card" style={{ textAlign: 'center' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div className="card-section-label" style={{ marginBottom: 2 }}>Air Quality Index</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Real-time AQI gauge</div>
        </div>
        <div style={{
          padding: '3px 10px', borderRadius: 20,
          background: aqi != null ? cat.color + '1a' : 'transparent',
          border: `1px solid ${aqi != null ? cat.color + '60' : 'transparent'}`,
          fontSize: 11, fontWeight: 600, color: cat.color,
          letterSpacing: '0.02em', textTransform: 'capitalize',
          transition: 'color 0.5s ease, border-color 0.5s ease',
        }}>
          {cat.label}
        </div>
      </div>

      {/* SVG Gauge */}
      <svg
        width="200" height="165"
        viewBox="0 0 200 165"
        style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
      >
        <defs>
          {/* Calm gradient: good → moderate → poor */}
          <linearGradient id="gauge-rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="var(--gauge-good, #3aaa6e)" />
            <stop offset="38%"  stopColor="var(--gauge-mod,  #c8893a)" />
            <stop offset="75%"  stopColor="var(--gauge-poor, #c05555)" />
            <stop offset="100%" stopColor="var(--gauge-poor, #c05555)" />
          </linearGradient>

          {/* Clip the entire gauge to its bounding box — keeps fill arc inside */}
          <clipPath id="gauge-clip">
            <rect x="0" y="0" width="200" height="165" />
          </clipPath>
        </defs>

        <g clipPath="url(#gauge-clip)">

          {/* ── Soft colour wash beneath the track (decorative) ── */}
          <path
            d={arcD(CX, CY, R_TRACK, ARC_START, ARC_END)}
            fill="none"
            stroke={aqi != null ? cat.color + '12' : 'transparent'}
            strokeWidth={22}
            strokeLinecap="round"
            style={{ transition: `stroke ${DURATION} ${EASE}` }}
          />

          {/* ── Background track ── */}
          <path
            d={arcD(CX, CY, R_TRACK, ARC_START, ARC_END)}
            fill="none"
            stroke={trackColor}
            strokeWidth={12}
            strokeLinecap="round"
          />

          {/* ── Filled arc ── */}
          {aqi != null && (
            <path
              d={arcD(CX, CY, R_TRACK, ARC_START, ARC_END)}
              fill="none"
              stroke="url(#gauge-rainbow)"
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={arcLength * (1 - pct)}
              opacity={pct > 0.005 ? 1 : 0}
              style={{
                transition: `stroke-dashoffset ${DURATION} ${EASE}, opacity 0.2s`,
              }}
            />
          )}

          {/* ── Zone tick: Good limit ── */}
          {(() => {
            const a  = angleAt(settings.aqiWarn)
            const p1 = polar(CX, CY, R_TRACK - 9, a)
            const p2 = polar(CX, CY, R_TRACK + 9, a)
            return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="var(--gauge-good, #3aaa6e)" strokeWidth={1.5} strokeOpacity={0.5} strokeLinecap="round" />
          })()}

          {/* ── Zone tick: Moderate limit ── */}
          {(() => {
            const a  = angleAt(settings.aqiAlert)
            const p1 = polar(CX, CY, R_TRACK - 9, a)
            const p2 = polar(CX, CY, R_TRACK + 9, a)
            return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="var(--gauge-mod, #c8893a)" strokeWidth={1.5} strokeOpacity={0.5} strokeLinecap="round" />
          })()}

          {/* ── Scale labels ── */}
          {scalePts.map(({ a, lbl }) => {
            const p = polar(CX, CY, R_TRACK + 19, a)
            return (
              <text key={lbl}
                x={p.x} y={p.y + 4}
                textAnchor="middle"
                fill={labelColor}
                fontSize={8.5}
                fontFamily="DM Mono, monospace"
              >
                {lbl}
              </text>
            )
          })}

        </g>

        {/*
          ── Needle: rotates via CSS transform around the hub (CX, CY) ──
          Using a <g> with CSS rotate avoids the x1/y1/x2/y2 linear interpolation
          problem that causes the needle tip to sweep outside the arc when the value
          jumps by a large margin. CSS rotate sweeps the needle along its proper arc.
          Non-overshooting easing keeps it strictly inside ARC_START…ARC_END.
        */}
        <g
          style={{
            transform: `rotate(${needleDeg}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: `transform ${DURATION} ${EASE}`,
          }}
        >
          {/* Needle shadow (slightly thicker, same colour as hub tint) */}
          <line
            x1={CX} y1={CY + 10}
            x2={CX} y2={CY - 60}
            stroke={cat.color + '28'}
            strokeWidth={5}
            strokeLinecap="round"
          />
          {/* Needle body */}
          <line
            x1={CX} y1={CY + 10}
            x2={CX} y2={CY - 60}
            stroke={needleColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>

        {/* ── Hub (drawn on top of needle, not rotated) ── */}
        <circle cx={CX} cy={CY} r={9}
          fill={cat.color + '1a'}
          stroke={cat.color}
          strokeWidth={1.5}
          style={{ transition: `fill ${DURATION} ${EASE}, stroke ${DURATION} ${EASE}`, filter: `drop-shadow(0 0 4px ${cat.color}55)` }}
        />
        <circle cx={CX} cy={CY} r={5} fill={cat.color} style={{ transition: `fill ${DURATION} ${EASE}` }} />
        <circle cx={CX} cy={CY} r={2.5} fill={darkMode ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)'} />

        {/* ── Centre value ── */}
        <text
          x={CX} y={CY + 28}
          textAnchor="middle"
          fill={aqi != null ? cat.color : labelColor}
          fontSize={26}
          fontWeight={700}
          fontFamily="DM Mono, monospace"
          style={{ transition: `fill ${DURATION} ${EASE}` }}
        >
          {aqi != null ? aqi.toFixed(1) : '—'}
        </text>
        <text x={CX} y={CY + 42} textAnchor="middle"
          fill={aqiLabelFill} fontSize={9} fontFamily="DM Mono, monospace">
          AQI
        </text>
      </svg>
    </div>
  )
}