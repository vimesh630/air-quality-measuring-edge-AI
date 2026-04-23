import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAQMData }          from './hooks/useAQMData'
import Navbar                  from './components/Navbar'
import AlertBanner             from './components/AlertBanner'
import MetricCard              from './components/MetricCard'
import ClassificationBadge     from './components/ClassificationBadge'
import AQIChart                from './components/AQIChart'
import EnvChart                from './components/EnvChart'
import DeviceControl           from './components/DeviceControl'
import ReadingsTable           from './components/ReadingsTable'
import GasReadings             from './components/GasReadings'
import { formatTemp, formatHum, formatAQI } from './utils/helpers'
import { getLabelColor }       from './utils/helpers'

// ── Stat card for the top summary row ──────────────────────────
const StatCard = ({ label, value, accent }) => (
  <div
    className="fade-up"
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 18px',
      textAlign: 'center',
      transition: 'border-color 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = (accent || 'var(--blue)') + '66'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
  >
    <div style={{
      fontSize: 26, fontWeight: 700,
      color: accent || 'var(--text-1)',
      letterSpacing: '-0.03em',
      fontFamily: 'var(--mono)',
      lineHeight: 1,
      marginBottom: 6
    }}>
      {value ?? '—'}
    </div>
    <div style={{
      fontSize: 12, fontWeight: 600,
      color: 'var(--text-3)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    }}>
      {label}
    </div>
  </div>
)

export default function App() {
  const [darkMode, setDarkMode] = useState(true)   // default dark

  const { readings, latest, stats, loading, lastUpdated } = useAQMData(5000)

  const labelColors = getLabelColor(latest?.label)

  // Apply light mode override via inline style on root
  const rootStyle = darkMode ? {} : {
    '--bg':          '#f0f0f5',
    '--bg-card':     '#ffffff',
    '--bg-elevated': '#f5f5fa',
    '--border':      'rgba(0,0,0,0.07)',
    '--border-mid':  'rgba(0,0,0,0.12)',
    '--text-1':      '#111118',
    '--text-2':      '#333355',
    '--text-3':      '#666688',
    '--blue-dim':    'rgba(41,121,255,0.08)',
    '--blue-glow':   'rgba(41,121,255,0.12)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', ...rootStyle }}>

      <Toaster position="top-right" />

      <Navbar
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
        latest={latest}
        lastUpdated={lastUpdated}
      />

      <AlertBanner latest={latest} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px' }}>

        {/* Loading state */}
        {loading && (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            color: 'var(--text-3)',
            fontSize: 13,
            fontFamily: 'var(--mono)'
          }}>
            Connecting to device...
          </div>
        )}

        {!loading && (
          <>
            {/* ── Top stats strip ─────────────────────── */}
            <div
              className="stat-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginBottom: 20
              }}
            >
              <StatCard label="Total readings" value={stats?.total} />
              <StatCard label="Total alerts"   value={stats?.alerts}              accent="var(--red)" />
              <StatCard label="Average AQI"    value={stats?.avg_aqi}             accent="var(--blue-bright)" />
              <StatCard label="Good readings"  value={stats?.label_counts?.good}  accent="var(--green)" />
            </div>

            {/* ── Live metric cards ────────────────────── */}
            <div
              className="metric-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                marginBottom: 20
              }}
            >
              <MetricCard
                label="Temperature"
                value={formatTemp(latest?.temperature)}
                unit="°C"
                accent="var(--blue-bright)"
                sublabel="DHT22 sensor"
              />
              <MetricCard
                label="Humidity"
                value={formatHum(latest?.humidity)}
                unit="%"
                accent="var(--green)"
                sublabel="DHT22 sensor"
              />
              <MetricCard
                label="Air Quality Index"
                value={formatAQI(latest?.aqi)}
                unit=""
                accent={labelColors.accent}
                sublabel={latest?.label ? `Classified as ${latest.label}` : 'MQ-135 sensor'}
              />
            </div>

            {/* ── Classification badge ─────────────────── */}
            <div style={{ marginBottom: 20 }}>
              <ClassificationBadge
                label={latest?.label}
                confidence={latest?.confidence}
              />
            </div>

            {/* ── Main two-column layout ───────────────── */}
            <div
              className="main-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                marginBottom: 16
              }}
            >
              {/* LEFT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <AQIChart readings={readings} />
                <EnvChart readings={readings} />
              </div>

              {/* RIGHT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <DeviceControl />
                <ReadingsTable readings={[...readings].reverse()} />
              </div>
            </div>

            {/* ── Gas readings — full width ────────────── */}
            <GasReadings latest={latest} />

          </>
        )}
      </div>
    </div>
  )
}