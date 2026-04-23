import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { formatTime } from '../utils/helpers'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-mid)',
      borderRadius: 8,
      padding: '8px 12px',
      fontFamily: 'var(--mono)',
      fontSize: 12
    }}>
      <div style={{ color: 'var(--text-3)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function EnvChart({ readings }) {
  const data = readings.map(r => ({
    time:        formatTime(r.timestamp),
    temperature: Number(Number(r.temperature).toFixed(1)),
    humidity:    Number(Number(r.humidity).toFixed(1))
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
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 12,
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 600,
            color: 'var(--text-3)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 4
          }}>
            Environment
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 400 }}>
            Temperature and humidity
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 20, height: 2, background: 'var(--blue-bright)', borderRadius: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--mono)', fontWeight: 500 }}>Temp C</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 20, height: 2, background: 'var(--green)', borderRadius: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--mono)', fontWeight: 500 }}>Humidity %</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,170,0.1)" />
          <XAxis
            dataKey="time"
            tick={false}
            axisLine={false} 
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-3)', fontFamily: 'DM Mono' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="temperature" name="Temp C"
            stroke="var(--blue-bright)" strokeWidth={2} dot={false}
            activeDot={{ r: 4, fill: 'var(--blue-bright)', stroke: 'var(--bg)', strokeWidth: 2 }}
          />
          <Line type="monotone" dataKey="humidity" name="Humidity %"
            stroke="var(--green)" strokeWidth={2} dot={false}
            activeDot={{ r: 4, fill: 'var(--green)', stroke: 'var(--bg)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}