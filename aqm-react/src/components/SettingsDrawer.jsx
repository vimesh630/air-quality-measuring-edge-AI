import { useState } from 'react'
import { X, Settings, Save, RotateCcw } from 'lucide-react'

import { DEFAULT_SETTINGS } from '../context/SettingsContext'

const SliderField = ({ label, value, min, max, step = 1, unit, color = '#2979ff', onChange }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color, fontFamily: 'var(--mono)', fontWeight: 600 }}>
        {value}{unit}
      </span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ accentColor: color }}
    />
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{min}{unit}</span>
      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{max}{unit}</span>
    </div>
  </div>
)

const SectionHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '0.04em' }}>{title}</div>
    {subtitle && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</div>}
  </div>
)



export default function SettingsDrawer({ open, onClose, settings, onSave }) {
  const [local, setLocal] = useState(settings)

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }))

  const handleSave = () => {
    onSave(local)
    onClose()
  }

  const handleReset = () => {
    setLocal(DEFAULT_SETTINGS)
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* Drawer */}
      <div className="drawer">
        {/* Drawer header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 36, height: 36,
            background: 'var(--blue-dim)',
            border: '1px solid rgba(41,121,255,0.3)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Settings size={16} color="var(--blue-bright)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Settings</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Alert thresholds & preferences</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* AQI Thresholds */}
        <SectionHeader title="AQI Thresholds" subtitle="US EPA standard: good ≤12, moderate ≤35.4" />
        <SliderField label="AQI Warning" value={local.aqiWarn}  min={10}  max={100} unit="" color="#ffab40" onChange={v => set('aqiWarn', v)} />
        <SliderField label="AQI Alert"   value={local.aqiAlert} min={20}  max={150} unit="" color="#ff5252" onChange={v => set('aqiAlert', v)} />

        {/* CO₂ Thresholds */}
        <SectionHeader title="CO₂ Thresholds" subtitle="Outdoor ~400 ppm; >1000 ppm = elevated" />
        <SliderField label="CO₂ Warning" value={local.co2Warn}  min={500}  max={3000} step={50} unit=" ppm" color="#ffab40" onChange={v => set('co2Warn', v)} />
        <SliderField label="CO₂ Alert"   value={local.co2Alert} min={1000} max={5000} step={100} unit=" ppm" color="#ff5252" onChange={v => set('co2Alert', v)} />

        {/* CO / NH₃ */}
        <SectionHeader title="Gas Thresholds" />
        <SliderField label="CO Warning"  value={local.coWarn}  min={1}  max={50}  unit=" ppm" color="#ffab40" onChange={v => set('coWarn', v)} />
        <SliderField label="NH₃ Warning" value={local.nh3Warn} min={5}  max={100} unit=" ppm" color="#ffab40" onChange={v => set('nh3Warn', v)} />

        {/* Temperature & Humidity */}
        <SectionHeader title="Comfort Range" subtitle="Ideal indoor environment" />
        <SliderField label="Min Temp" value={local.tempMin} min={10} max={25} unit="°C" color="#448aff" onChange={v => set('tempMin', v)} />
        <SliderField label="Max Temp" value={local.tempMax} min={22} max={35} unit="°C" color="#448aff" onChange={v => set('tempMax', v)} />
        <SliderField label="Min Humidity" value={local.humMin} min={10} max={45} unit="%" color="#00e676" onChange={v => set('humMin', v)} />
        <SliderField label="Max Humidity" value={local.humMax} min={45} max={90} unit="%" color="#00e676" onChange={v => set('humMax', v)} />

        {/* Refresh interval */}
        <SectionHeader title="Data Refresh" />
        <SliderField label="Refresh interval" value={local.refreshInterval} min={2} max={30} unit="s" color="var(--blue-bright)" onChange={v => set('refreshInterval', v)} />

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={handleReset}
            style={{
              flex: 1, padding: '10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              color: 'var(--text-2)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2, padding: '10px', borderRadius: 8,
              background: 'var(--blue-dim)',
              border: '1px solid rgba(41,121,255,0.4)',
              color: 'var(--blue-bright)', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(41,121,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--blue-dim)'}
          >
            <Save size={13} /> Save Settings
          </button>
        </div>

        <div style={{ marginTop: 20, fontSize: 10, color: 'var(--text-3)', textAlign: 'center', fontStyle: 'italic' }}>
          Settings are saved in your browser (localStorage)
        </div>
      </div>
    </>
  )
}