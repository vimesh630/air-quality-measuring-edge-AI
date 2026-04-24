import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, ReferenceArea } from 'recharts'
import { Wind, Thermometer, Droplets } from 'lucide-react'
import { useSettingsContext } from '../context/SettingsContext'
import { getComfortStatus } from '../utils/helpers'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-mid)',
      borderRadius: 8, padding: '8px 12px',
      fontFamily: 'DM Mono, monospace', fontSize: 12
    }}>
      <div style={{ color: 'var(--blue-bright)', marginBottom: 4 }}>Current Position</div>
      <div style={{ color: 'var(--text-2)' }}>Temp: <strong>{payload[0]?.value}°C</strong></div>
      <div style={{ color: 'var(--text-2)' }}>Humidity: <strong>{payload[1]?.value}%</strong></div>
    </div>
  )
}

export default function ComfortZone({ latest }) {
  const { settings } = useSettingsContext()
  const temp   = latest?.temperature != null ? Number(latest.temperature) : null
  const hum    = latest?.humidity    != null ? Number(latest.humidity)    : null
  const status = getComfortStatus(temp, hum, settings)

  const currentPoint = temp != null && hum != null ? [{ temp, hum }] : []

  const comfortColor = status.inZone === true  ? '#00e676'
                     : status.inZone === false ? '#ffab40' : '#8888aa'

  return (
    <div className="fade-up glass-card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: `${comfortColor}18`,
            border: `1px solid ${comfortColor}44`,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Thermometer size={15} color={comfortColor} />
          </div>
          <div>
            <div className="card-section-label">Comfort Zone</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>ASHRAE 55 standard</div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          background: `${comfortColor}15`,
          border: `1px solid ${comfortColor}33`,
          borderRadius: 20,
          fontSize: 11, fontWeight: 600, color: comfortColor
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: comfortColor }} />
          {status.label}
        </div>
      </div>

      {/* Current values */}
      {temp != null && hum != null && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{
            flex: 1, padding: '8px 12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8, textAlign: 'center'
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue-bright)', fontFamily: 'var(--mono)' }}>
              {temp.toFixed(1)}°C
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Temperature</div>
          </div>
          <div style={{
            flex: 1, padding: '8px 12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8, textAlign: 'center'
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)' }}>
              {hum.toFixed(1)}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Humidity</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <ScatterChart margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,170,0.08)" />

          {/* Custom comfort zone shaded area */}
          <ReferenceArea x1={settings.tempMin} x2={settings.tempMax} y1={settings.humMin} y2={settings.humMax}
            fill="rgba(0,230,118,0.07)"
            stroke="rgba(0,230,118,0.25)"
            strokeDasharray="4 3"
            label={{ value: 'Comfort zone', fill: 'rgba(0,230,118,0.5)', fontSize: 9, position: 'insideTopLeft' }}
          />

          <XAxis
            type="number" dataKey="temp"
            domain={[10, 40]}
            name="Temperature"
            label={{ value: '°C', position: 'insideRight', fill: 'var(--text-3)', fontSize: 10 }}
            tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'DM Mono' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            type="number" dataKey="hum"
            domain={[0, 100]}
            name="Humidity"
            label={{ value: '%RH', angle: -90, position: 'insideLeft', fill: 'var(--text-3)', fontSize: 10, dy: 20 }}
            tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'DM Mono' }}
            axisLine={false} tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--border-mid)' }} />

          <Scatter
            data={currentPoint}
            fill={comfortColor}
            shape={(props) => {
              const { cx, cy } = props
              return (
                <g>
                  <circle cx={cx} cy={cy} r={10} fill={`${comfortColor}22`} stroke={comfortColor} strokeWidth={1.5} />
                  <circle cx={cx} cy={cy} r={5}  fill={comfortColor} />
                </g>
              )
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 8, fontStyle: 'italic' }}>
        Green zone = Target comfort range defined in settings
      </div>
    </div>
  )
}