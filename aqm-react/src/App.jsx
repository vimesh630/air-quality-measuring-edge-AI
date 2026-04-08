import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { LayoutDashboard, BarChart3 } from 'lucide-react'

import { useAQMData }          from './hooks/useAQMData'
import Navbar                  from './components/Navbar'
import AlertBanner             from './components/AlertBanner'
import MetricCard              from './components/MetricCard'
import ClassificationBadge     from './components/ClassificationBadge'
import AQIChart                from './components/AQIChart'
import AQIGauge                from './components/AQIGauge'
import EnvChart                from './components/EnvChart'
import DeviceControl           from './components/DeviceControl'
import ReadingsTable           from './components/ReadingsTable'
import GasReadings             from './components/GasReadings'
import HealthScore             from './components/HealthScore'
import VentilationAdvice       from './components/VentilationAdvice'
import QualityDonut            from './components/QualityDonut'
import ComfortZone             from './components/ComfortZone'
import SettingsDrawer, { useSettings } from './components/SettingsDrawer'

import { formatTemp, formatHum, formatAQI, getLabelColor } from './utils/helpers'

// ── Stat card ────────────────────────────────────────────────
const StatCard = ({ label, value, accent, icon: Icon }) => (
  <div
    className="fade-up glass-card"
    style={{
      textAlign: 'center',
      transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = (accent || 'var(--blue)') + '55'
      e.currentTarget.style.transform   = 'translateY(-2px)'
      e.currentTarget.style.boxShadow   = `var(--shadow-card), 0 0 18px ${accent || 'rgba(41,121,255,0.2)'}44`
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border)'
      e.currentTarget.style.transform   = 'translateY(0)'
      e.currentTarget.style.boxShadow   = 'var(--shadow-card)'
    }}
  >
    {/* Top glow */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
      background: `linear-gradient(90deg, transparent, ${accent || 'var(--blue)'}, transparent)`,
      opacity: 0.7, borderRadius: '16px 16px 0 0'
    }} />
    <div style={{
      fontSize: 28, fontWeight: 700,
      color: accent || 'var(--text-1)',
      letterSpacing: '-0.03em',
      fontFamily: 'var(--mono)',
      lineHeight: 1,
      marginBottom: 6,
      textShadow: accent ? `0 0 20px ${accent}55` : 'none'
    }}>
      {value ?? '—'}
    </div>
    <div style={{
      fontSize: 10, fontWeight: 600,
      color: 'var(--text-3)',
      letterSpacing: '0.12em',
      textTransform: 'uppercase'
    }}>
      {label}
    </div>
  </div>
)

// ── Tab button ───────────────────────────────────────────────
const TabBtn = ({ id, icon: Icon, label, active, onClick }) => (
  <button id={id} className={`tab-btn ${active ? 'active' : ''}`} onClick={onClick}>
    <Icon size={14} />
    {label}
  </button>
)

// ── Section label ────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 10, fontWeight: 700,
    color: 'var(--text-3)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingLeft: 2
  }}>
    {children}
  </div>
)

export default function App() {
  const [darkMode,    setDarkMode]    = useState(true)
  const [tab,         setTab]         = useState('overview')   // 'overview' | 'analytics'
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { settings, save: saveSettings } = useSettings()

  const refreshMs = (settings.refreshInterval || 5) * 1000
  const { readings, latest, stats, loading, lastUpdated } = useAQMData(refreshMs)
  const connected = !!lastUpdated   // connected if we got data at least once

  const labelColors = getLabelColor(latest?.label)

  // Light mode token overrides (Apple iOS style)
  const rootStyle = darkMode ? {} : {
    '--bg':               '#f2f2f7',       /* iOS grouped background */
    '--bg-card':          '#ffffff',       /* iOS solid white card */
    '--bg-elevated':      '#e5e5ea',       /* iOS gray 5 */
    '--bg-glass':         'rgba(255,255,255,0.85)',
    '--border':           'rgba(0,0,0,0.06)',
    '--border-mid':       'rgba(0,0,0,0.12)',
    '--text-1':           '#000000',
    '--text-2':           'rgba(60,60,67,0.6)', /* iOS secondary text */
    '--text-3':           'rgba(60,60,67,0.3)', /* iOS tertiary text */
    '--text-4':           '#aeaeb2',
    '--blue':             '#007aff',       /* iOS standard blue */
    '--blue-bright':      '#0a84ff',
    '--blue-dim':         'rgba(0,122,255,0.10)',
    '--green':            '#34c759',
    '--amber':            '#ff9500',
    '--red':              '#ff3b30',
    '--purple':           '#af52de',
    '--cyan':             '#32ade6',
    '--gauge-good':       '#34c759',
    '--gauge-mod':        '#ff9500',
    '--gauge-poor':       '#ff3b30',
    '--shadow-card':      '0 4px 18px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)',
    '--scrollbar-thumb':  'rgba(0,0,0,0.15)',
    '--scrollbar-hover':  'rgba(0,0,0,0.30)',
    '--range-track':      'rgba(0,0,0,0.08)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', ...rootStyle, position: 'relative' }}>



      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: darkMode ? '#111128' : 'rgba(255,255,255,0.95)',
            color: darkMode ? '#f0f0f8' : '#111118',
            border: '1px solid rgba(41,121,255,0.3)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13
          }
        }}
      />

      <Navbar
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
        latest={latest}
        lastUpdated={lastUpdated}
        onOpenSettings={() => setSettingsOpen(true)}
        connected={connected}
      />

      <AlertBanner latest={latest} />

      {/* Settings drawer */}
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      <div style={{ maxWidth: 1340, margin: '0 auto', padding: '28px 28px', position: 'relative', zIndex: 1 }}>

        {/* Loading state */}
        {loading && (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            color: 'var(--text-3)', fontSize: 13,
            fontFamily: 'var(--mono)'
          }}>
            <div style={{
              display: 'inline-block',
              width: 40, height: 40,
              border: '2px solid var(--border)',
              borderTop: '2px solid var(--blue)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: 16
            }} />
            <br />Connecting to device…
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Tab bar ─────────────────────────────────────────── */}
            <div className="tab-bar">
              <TabBtn id="tab-overview"   icon={LayoutDashboard} label="Overview"  active={tab === 'overview'}  onClick={() => setTab('overview')}  />
              <TabBtn id="tab-analytics"  icon={BarChart3}       label="Analytics" active={tab === 'analytics'} onClick={() => setTab('analytics')} />
            </div>

            {/* ══════════════ OVERVIEW TAB ══════════════ */}
            {tab === 'overview' && (
              <>
                {/* ── Stat strip ────────────────────────────────── */}
                <div
                  className="stat-grid"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}
                >
                  <StatCard label="Total Readings" value={stats?.total} />
                  <StatCard label="Total Alerts"   value={stats?.alerts}             accent="var(--red)" />
                  <StatCard label="Average AQI"    value={stats?.avg_aqi}            accent="var(--blue-bright)" />
                  <StatCard label="Good Readings"  value={stats?.label_counts?.good} accent="var(--green)" />
                </div>

                {/* ── Live metric cards ──────────────────────────── */}
                <SectionLabel>Live Sensor Readings</SectionLabel>
                <div
                  className="metric-grid"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}
                >
                  <MetricCard
                    label="Temperature"
                    value={formatTemp(latest?.temperature)}
                    raw={latest?.temperature}
                    unit="°C"
                    accent="var(--blue-bright)"
                    sublabel="DHT22 sensor"
                  />
                  <MetricCard
                    label="Humidity"
                    value={formatHum(latest?.humidity)}
                    raw={latest?.humidity}
                    unit="%"
                    accent="var(--green)"
                    sublabel="DHT22 sensor"
                  />
                  <MetricCard
                    label="Air Quality Index"
                    value={formatAQI(latest?.aqi)}
                    raw={latest?.aqi}
                    unit=""
                    accent={labelColors.accent}
                    sublabel={latest?.label ? `Classified as ${latest.label}` : 'MQ-135 sensor'}
                  />
                </div>

                {/* ── Classification badge ───────────────────────── */}
                <div style={{ marginBottom: 24 }}>
                  <ClassificationBadge label={latest?.label} confidence={latest?.confidence} />
                </div>

                {/* ── Row 1: Gauge + HealthScore ─────────────────── */}
                <SectionLabel>Air Quality Analysis</SectionLabel>
                <div
                  className="main-grid"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}
                >
                  <AQIGauge value={latest?.aqi} darkMode={darkMode} />
                  <HealthScore reading={latest} />
                </div>

                {/* ── Row 2: Ventilation + Device Control ─────────── */}
                <div
                  className="main-grid"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}
                >
                  <VentilationAdvice reading={latest} />
                  <DeviceControl />
                </div>

                {/* ── Row 3: Readings table full width ────────────── */}
                <div style={{ marginBottom: 16 }}>
                  <ReadingsTable readings={[...readings].reverse()} />
                </div>

                {/* ── Gas readings full width ────────────────────── */}
                <GasReadings latest={latest} />
              </>
            )}

            {/* ══════════════ ANALYTICS TAB ══════════════ */}
            {tab === 'analytics' && (
              <>
                {/* ── Stat strip (same) ──────────────────────────── */}
                <div
                  className="stat-grid"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}
                >
                  <StatCard label="Total Readings" value={stats?.total} />
                  <StatCard label="Total Alerts"   value={stats?.alerts}             accent="var(--red)" />
                  <StatCard label="Average AQI"    value={stats?.avg_aqi}            accent="var(--blue-bright)" />
                  <StatCard label="Good Readings"  value={stats?.label_counts?.good} accent="var(--green)" />
                </div>

                {/* ── Charts row ─────────────────────────────────── */}
                <SectionLabel>Trend Charts</SectionLabel>
                <div
                  className="analytics-grid"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}
                >
                  <AQIChart readings={readings} />
                  <EnvChart readings={readings} />
                </div>

                {/* ── Quality donut + Comfort zone ───────────────── */}
                <SectionLabel>Quality Distribution & Comfort</SectionLabel>
                <div
                  className="analytics-grid"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}
                >
                  <QualityDonut stats={stats} />
                  <ComfortZone  latest={latest} />
                </div>

                {/* ── Gas readings full width ────────────────────── */}
                <GasReadings latest={latest} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
