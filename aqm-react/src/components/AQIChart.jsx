import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts'
import { formatTime } from '../utils/helpers'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const aqi   = payload[0]?.value
  const color = aqi <= 12 ? '#00e676' : aqi <= 35.4 ? '#ffab40' : '#ff5252'
  return (
    <div style={{
      background: '#16161f',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: '8px 12px',
      fontFamily: "'DM Mono', monospace",
      fontSize: 12
    }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontWeight: 600 }}>AQI {aqi}</div>
    </div>
  )
}

export default function AQIChart({ readings }) {
  const data = readings.map(r => ({
    time: formatTime(r.timestamp),
    aqi:  Number(Number(r.aqi).toFixed(1))
  }))

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: 'var(--text-3)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 3
          }}>
            Air Quality Index
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            Last 30 readings — hover to inspect
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {[['#00e676','Good ≤12'], ['#ffab40','Mod ≤35'], ['#ff5252','Poor']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="aqi-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#2979ff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#2979ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,170,0.1)" />

          {/* X axis — ticks hidden, axis line hidden, only tooltip shows time */}
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={false}
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: 'var(--text-3)', fontFamily: "'DM Mono'" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={12}   stroke="#00e676" strokeDasharray="4 3" strokeOpacity={0.35} />
          <ReferenceLine y={35.4} stroke="#ffab40" strokeDasharray="4 3" strokeOpacity={0.35} />
          <Area
            type="monotone" dataKey="aqi"
            stroke="#2979ff" strokeWidth={2}
            fill="url(#aqi-grad)"
            dot={false}
            activeDot={{ r: 4, fill: '#448aff', stroke: '#0a0a0f', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}