import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer
} from 'recharts'
import { formatTime } from '../utils/helpers'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const aqi   = payload[0]?.value
  const color = aqi <= 12 ? '#00e676' : aqi <= 35.4 ? '#ffab40' : '#ff5252'
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-mid)',
      borderRadius: 8,
      padding: '8px 14px',
      fontFamily: "'DM Mono', monospace",
      fontSize: 12,
      boxShadow: 'var(--shadow-card)'
    }}>
      <div style={{ color: 'var(--text-3)', marginBottom: 4, fontSize: 10 }}>{label}</div>
      <div style={{ color, fontWeight: 700, fontSize: 15 }}>AQI {aqi}</div>
      <div style={{ fontSize: 10, color: aqi <= 12 ? '#00e676' : aqi <= 35.4 ? '#ffab40' : '#ff5252', marginTop: 2, opacity: 0.7 }}>
        {aqi <= 12 ? 'Good' : aqi <= 35.4 ? 'Moderate' : 'Poor'}
      </div>
    </div>
  )
}

export default function AQIChart({ readings }) {
  const data = readings.map(r => ({
    time: formatTime(r.timestamp),
    aqi:  Number(Number(r.aqi).toFixed(1))
  }))

  return (
    <div className="fade-up glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="card-section-label" style={{ marginBottom: 3 }}>
            Air Quality Index
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            Last 30 readings — hover to inspect
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {[['#3aaa6e','Good ≤12'], ['#c8893a','Mod ≤35'], ['#c05555','Poor']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: c,
              }} />
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="aqi-grad-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#4a6fa5" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#4a6fa5" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Color zone reference areas */}
          <ReferenceArea y1={0}    y2={12}   fill="rgba(58,170,110,0.05)"  />
          <ReferenceArea y1={12}   y2={35.4} fill="rgba(200,137,58,0.05)" />
          <ReferenceArea y1={35.4} y2={100}  fill="rgba(192,85,85,0.05)"  />

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,170,0.07)" />

          <XAxis
            dataKey="time"
            axisLine={false} tickLine={false} tick={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'var(--text-3)', fontFamily: "'DM Mono'" }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Threshold reference lines */}
          <ReferenceLine y={12}   stroke="#3aaa6e" strokeDasharray="4 3" strokeOpacity={0.4} strokeWidth={1} />
          <ReferenceLine y={35.4} stroke="#c8893a" strokeDasharray="4 3" strokeOpacity={0.4} strokeWidth={1} />

          <Area
            type="monotoneX" dataKey="aqi"
            stroke="#4a6fa5" strokeWidth={2}
            fill="url(#aqi-grad-fill)"
            dot={false}
            activeDot={{ r: 4, fill: '#4a6fa5', stroke: 'var(--bg)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}