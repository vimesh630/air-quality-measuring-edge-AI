import React from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot 
} from 'recharts'
import { Sparkles, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  const isFuture = data.isFuture
  
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: `1px solid ${isFuture ? 'var(--purple)' : 'var(--blue-bright)'}`,
      borderRadius: 12,
      padding: '10px 16px',
      fontFamily: "'DM Mono', monospace",
      fontSize: 12,
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(10px)',
      borderWidth: isFuture ? 2 : 1
    }}>
      <div style={{ color: 'var(--text-4)', marginBottom: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {isFuture ? 'AI Calculation' : 'Actual Data'}
      </div>
      <div style={{ color: isFuture ? 'var(--purple-bright)' : 'var(--blue-bright)', fontWeight: 800, fontSize: 18 }}>
        AQI {data.aqi.toFixed(1)}
      </div>
      <div style={{ color: 'var(--text-3)', fontSize: 10, marginTop: 4 }}>
        {isFuture ? 'Next Hour (+1h)' : `Time Step -${24 - data.index}h`}
      </div>
    </div>
  )
}

export default function AQIForecast({ forecast }) {
  if (!forecast) {
    return (
      <div className="fade-up glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', padding: 40 }}>
        <div style={{ position: 'relative' }}>
          <Sparkles size={48} color="var(--purple)" style={{ marginBottom: 24, opacity: 0.3 }} />
          <div className="pulsing-dot" style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, background: 'var(--purple)' }} />
        </div>
        <div style={{ color: 'var(--text-1)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>AI Calibration Initializing...</div>
        <div style={{ color: 'var(--text-3)', fontSize: 14, maxWidth: 300, lineHeight: 1.5 }}>
          The LSTM model requires 24 continuous hours of localized sensor data to stabilize its internal weights for your environment.
        </div>
      </div>
    )
  }

  const { history, prediction, last_actual } = forecast
  
  // Prepare data for the chart
  // history is usually 24 points
  const chartData = history.map((val, i) => ({
    index: i,
    aqi: val,
    isFuture: false,
    historyVal: val,
    predictionVal: null
  }))

  // The bridge: last actual is starting point for prediction line
  const lastIndex = history.length - 1
  chartData[lastIndex].predictionVal = last_actual

  // Add the future point
  chartData.push({
    index: history.length,
    aqi: prediction,
    isFuture: true,
    historyVal: null,
    predictionVal: prediction
  })

  const diff = prediction - last_actual
  const trend = Math.abs(diff) < 1 ? 'stable' : diff > 0 ? 'up' : 'down'
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'var(--red)' : trend === 'down' ? 'var(--green-bright)' : 'var(--text-4)'
  const trendLabel = trend === 'up' ? 'Rising Air Quality Index' : trend === 'down' ? 'Lowering Air Quality Index' : 'Stable Air Quality'

  return (
    <div className="fade-up glass-card" style={{ padding: 24 }}>
      {/* Header Comparison Section */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <div style={{ flex: 1, padding: '16px 20px', background: 'rgba(52, 199, 255, 0.03)', borderRadius: 16, border: '1px solid rgba(52, 199, 255, 0.1)' }}>
          <div style={{ color: 'var(--blue-bright)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Current Status</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)' }}>{last_actual.toFixed(1)}</span>
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>AQI</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-4)' }}>
          <TrendingRight size={20} />
        </div>

        <div style={{ flex: 1, padding: '16px 20px', background: 'rgba(175, 82, 222, 0.05)', borderRadius: 16, border: '1px solid rgba(175, 82, 222, 0.2)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple-bright)', boxShadow: '0 0 10px var(--purple-bright)' }} />
            <div style={{ color: 'var(--purple-bright)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Prediction (+1h)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--purple-bright)' }}>{prediction.toFixed(1)}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: trendColor + '15', marginLeft: 12 }}>
              <TrendIcon size={12} color={trendColor} />
              <span style={{ fontSize: 10, fontWeight: 800, color: trendColor }}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div style={{ position: 'relative', height: 280, width: '100%', marginBottom: 12 }}>
        <div style={{ position: 'absolute', top: -20, left: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="var(--purple-bright)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Predictive Trend Analysis</span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="historyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--blue-bright)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--blue-bright)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--purple-bright)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--purple-bright)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,170,0.05)" vertical={false} />
            
            <XAxis dataKey="index" hide />
            <YAxis 
              domain={['dataMin - 5', 'dataMax + 10']} 
              tick={{ fontSize: 10, fill: 'var(--text-4)', fontFamily: 'var(--mono)' }}
              axisLine={false} tickLine={false}
            />
            
            <Tooltip content={<CustomTooltip />} />

            {/* Historical Area */}
            <Area
              type="monotone"
              dataKey="historyVal"
              stroke="var(--blue-bright)"
              strokeWidth={2}
              fill="url(#historyGrad)"
              isAnimationActive={true}
              dot={false}
            />

            {/* AI Forecast Area (Connecting last actual to prediction) */}
            <Area
              type="monotone"
              dataKey="predictionVal"
              stroke="var(--purple-bright)"
              strokeWidth={3}
              strokeDasharray="6 6"
              fill="url(#forecastGrad)"
              isAnimationActive={true}
              dot={false}
            />

            {/* vertical indicator for 'NOW' */}
            <ReferenceLine x={lastIndex} stroke="var(--blue-bright)" strokeWidth={1} strokeDasharray="3 3" label={{ position: 'top', value: 'NOW', fill: 'var(--text-4)', fontSize: 9, fontWeight: 700 }} />

            {/* The single point for forecast */}
            <ReferenceDot 
              x={chartData.length - 1} 
              y={prediction} 
              r={6} 
              fill="var(--purple-bright)" 
              stroke="none"
              className="prediction-dot-pulse"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <Info size={16} color="var(--purple-bright)" />
        <div style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--text-3)' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>Insight:</span> Air quality is <span style={{ color: trendColor, fontWeight: 700 }}>{trendLabel}</span> based on persistent {diff > 0 ? 'accumulation' : 'clearance'} patterns detected in the last 6 hours.
        </div>
      </div>
    </div>
  )
}

function TrendingRight({ size, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14m-7-7 7 7-7 7"/>
    </svg>
  )
}
