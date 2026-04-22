import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CheckCircle2, Minus, AlertTriangle } from 'lucide-react'

const COLORS = { good: '#3aaa6e', moderate: '#c8893a', poor: '#c05555' }
const LABELS = {
  good:     { Icon: CheckCircle2, label: 'Good' },
  moderate: { Icon: Minus,        label: 'Moderate' },
  poor:     { Icon: AlertTriangle, label: 'Poor' },
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  const { Icon, label } = LABELS[name] || { label: name }
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-mid)',
      borderRadius: 8, padding: '8px 12px',
      fontFamily: 'DM Mono, monospace', fontSize: 12
    }}>
      <div style={{ color: COLORS[name] || 'var(--text-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
        {Icon && <Icon size={12} />} {label}: {value}
      </div>
    </div>
  )
}

export default function QualityDonut({ stats }) {
  const counts = stats?.label_counts || {}
  const total  = (counts.good || 0) + (counts.moderate || 0) + (counts.poor || 0)

  const data = [
    { name: 'good',     value: counts.good     || 0 },
    { name: 'moderate', value: counts.moderate  || 0 },
    { name: 'poor',     value: counts.poor      || 0 },
  ].filter(d => d.value > 0)

  const hasData = total > 0

  return (
    <div className="fade-up glass-card">
      <div style={{ marginBottom: 16 }}>
        <div className="card-section-label" style={{ marginBottom: 3 }}>Quality Breakdown</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Last 100 readings distribution</div>
      </div>

      {!hasData ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 12 }}>
          No data available
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Donut */}
          <div style={{ flexShrink: 0 }}>
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie
                  data={data}
                  cx={70} cy={70}
                  innerRadius={42} outerRadius={65}
                  startAngle={90} endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                  paddingAngle={3}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name}
                      fill={COLORS[entry.name] || '#ccc'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend + counts */}
          <div style={{ flex: 1 }}>
            {Object.entries(LABELS).map(([key, { Icon, label }]) => {
              const count = counts[key] || 0
              const pct   = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0',
                  borderBottom: key !== 'poor' ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: COLORS[key],
                    flexShrink: 0
                  }} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon size={12} color={COLORS[key]} /> {label}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLORS[key], fontFamily: 'var(--mono)' }}>{pct}%</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>({count})</span>
                  </div>
                </div>
              )
            })}

            <div style={{ marginTop: 12, padding: '8px 10px', background: 'var(--bg-glass)', borderRadius: 8, borderLeft: '2px solid var(--blue)', border: '1px solid var(--border)', borderLeftWidth: 2, borderLeftColor: 'var(--blue)' }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Total readings analyzed: </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--mono)' }}>{total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
