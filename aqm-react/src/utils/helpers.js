// ── Label colour mapping ────────────────────────────────────
export const getLabelColor = (label) => {
  switch (label) {
    case 'good':     return { accent: '#3aaa6e', dim: 'rgba(58,170,110,0.12)',  text: '#3aaa6e', glow: 'rgba(58,170,110,0.20)' }
    case 'moderate': return { accent: '#c8893a', dim: 'rgba(200,137,58,0.12)',  text: '#c8893a', glow: 'rgba(200,137,58,0.20)' }
    case 'poor':     return { accent: '#c05555', dim: 'rgba(192,85,85,0.12)',   text: '#c05555', glow: 'rgba(192,85,85,0.20)' }
    default:         return { accent: '#7878a0', dim: 'rgba(120,120,160,0.10)', text: '#7878a0', glow: 'rgba(120,120,160,0.10)' }
  }
}

// ── Gas status ──────────────────────────────────────────────
export const getGasStatus = (value, safe, warn) => {
  if (value === null || value === undefined) return { label: '--',        color: '#7878a0', dim: 'rgba(120,120,160,0.10)' }
  if (value <= safe)  return { label: 'Safe',      color: '#3aaa6e', dim: 'rgba(58,170,110,0.10)' }
  if (value <= warn)  return { label: 'Elevated',  color: '#c8893a', dim: 'rgba(200,137,58,0.10)' }
  return               { label: 'Dangerous', color: '#c05555', dim: 'rgba(192,85,85,0.10)' }
}

// ── Formatters ──────────────────────────────────────────────
export const formatTime = (ts) => {
  if (!ts) return '--'
  try {
    const d = new Date(ts)
    if (isNaN(d.getTime())) {
      // fallback: if not parseable, just show raw
      return ts
    }
    const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    return `${date} ${time}`
  } catch {
    return ts
  }
}

export const formatTemp = (v) => v != null ? `${Number(v).toFixed(1)}` : '--'
export const formatHum  = (v) => v != null ? `${Number(v).toFixed(1)}` : '--'
export const formatAQI  = (v) => v != null ? Number(v).toFixed(1)       : '--'
export const formatConf = (v) => v != null ? `${(Number(v)*100).toFixed(1)}%` : '--'
export const formatPPM  = (v) => v != null ? Number(v).toFixed(1)       : '--'

// ── Health Impact Score ─────────────────────────────────────
// Computes a 0–100 score  (100 = perfect, 0 = dangerous)
// based on AQI, temperature, humidity, CO₂, CO, NH₃
export const computeHealthScore = (reading) => {
  if (!reading) return null

  const aqi  = Number(reading.aqi  ?? 0)
  const temp = Number(reading.temperature ?? 22)
  const hum  = Number(reading.humidity    ?? 50)
  const co2  = Number(reading.co2_ppm     ?? 400)
  const co   = Number(reading.co_ppm      ?? 0)
  const nh3  = Number(reading.nh3_ppm     ?? 0)

  // AQI sub-score (AQI 0–12 = 100, 35.4 = 60, 100+ = 0)
  const aqiScore = aqi <= 12  ? 100
                 : aqi <= 35.4 ? Math.round(100 - ((aqi - 12) / 23.4) * 40)
                 : Math.max(0, Math.round(60 - ((aqi - 35.4) / 64.6) * 60))

  // Temp comfort: 20–26°C ideal
  const tempDiff = Math.abs(temp - 23)
  const tempScore = Math.max(0, 100 - tempDiff * 10)

  // Humidity comfort: 40–60% ideal
  const humDiff = Math.max(0, Math.abs(hum - 50) - 10)
  const humScore = Math.max(0, 100 - humDiff * 5)

  // CO₂: 400–1000 good, 2000+ dangerous
  const co2Score = co2 <= 1000 ? 100
                 : co2 <= 2000 ? Math.round(100 - ((co2 - 1000) / 1000) * 60)
                 : Math.max(0, 40 - ((co2 - 2000) / 1000) * 40)

  // CO: 0–9 safe
  const coScore = co <= 9  ? 100
                : co <= 35 ? Math.round(100 - ((co - 9) / 26) * 70)
                : 0

  // NH₃: 0–25 safe
  const nh3Score = nh3 <= 25 ? 100
                 : nh3 <= 50  ? Math.round(100 - ((nh3 - 25) / 25) * 60)
                 : 0

  // Weighted average
  const score = Math.round(
    aqiScore  * 0.35 +
    co2Score  * 0.20 +
    coScore   * 0.20 +
    nh3Score  * 0.10 +
    tempScore * 0.10 +
    humScore  * 0.05
  )
  return Math.min(100, Math.max(0, score))
}

export const getHealthLabel = (score) => {
  if (score == null) return { label: 'Unknown',   icon: 'HelpCircle',    color: '#7878a0', dim: 'rgba(120,120,160,0.10)' }
  if (score >= 85)   return { label: 'Excellent', icon: 'CheckCircle2',  color: '#3aaa6e', dim: 'rgba(58,170,110,0.12)' }
  if (score >= 65)   return { label: 'Good',      icon: 'ThumbsUp',     color: '#55a87a', dim: 'rgba(85,168,122,0.10)' }
  if (score >= 45)   return { label: 'Fair',      icon: 'Minus',        color: '#c8893a', dim: 'rgba(200,137,58,0.12)' }
  if (score >= 25)   return { label: 'Poor',      icon: 'AlertTriangle',color: '#b86040', dim: 'rgba(184,96,64,0.12)' }
  return                    { label: 'Dangerous', icon: 'AlertOctagon', color: '#c05555', dim: 'rgba(192,85,85,0.12)' }
}

// ── Ventilation Advice ──────────────────────────────────────
export const getVentilationAdvice = (reading) => {
  if (!reading) return []

  const advice = []
  const aqi  = Number(reading.aqi  ?? 0)
  const temp = Number(reading.temperature ?? 22)
  const hum  = Number(reading.humidity    ?? 50)
  const co2  = Number(reading.co2_ppm     ?? 400)
  const co   = Number(reading.co_ppm      ?? 0)
  const nh3  = Number(reading.nh3_ppm     ?? 0)

  // AQI recommendations
  if (aqi > 35.4) {
    advice.push({ icon: 'DoorOpen',      text: 'Open windows immediately — AQI elevated', priority: 'high',   color: '#c05555' })
    advice.push({ icon: 'AirVent',       text: 'Run air purifier on high speed',          priority: 'high',   color: '#c05555' })
  } else if (aqi > 12) {
    advice.push({ icon: 'DoorOpen',      text: 'Consider ventilating — moderate AQI',    priority: 'medium', color: '#c8893a' })
  } else {
    advice.push({ icon: 'CheckCircle2',  text: 'Air quality is good — no action needed', priority: 'low',    color: '#3aaa6e' })
  }

  // CO₂
  if (co2 > 2000) {
    advice.push({ icon: 'Siren',         text: 'Critical CO₂ level — ventilate now!',              priority: 'high',   color: '#c05555' })
  } else if (co2 > 1000) {
    advice.push({ icon: 'Wind',          text: 'CO₂ elevated — increase air circulation',           priority: 'medium', color: '#c8893a' })
  }

  // CO
  if (co > 35) {
    advice.push({ icon: 'Siren',         text: 'Dangerous CO levels — evacuate and ventilate!',    priority: 'high',   color: '#c05555' })
  } else if (co > 9) {
    advice.push({ icon: 'AlertTriangle', text: 'CO slightly elevated — check ventilation',          priority: 'medium', color: '#c8893a' })
  }

  // NH₃
  if (nh3 > 50) {
    advice.push({ icon: 'CloudOff',      text: 'High ammonia — ventilate and check sources',        priority: 'medium', color: '#c8893a' })
  }

  // Temperature
  if (temp > 28) {
    advice.push({ icon: 'Snowflake',     text: 'Room is warm — consider AC or fan',                 priority: 'low',    color: '#3a9cb5' })
  } else if (temp < 18) {
    advice.push({ icon: 'Flame',         text: 'Room is cool — check heating',                      priority: 'low',    color: '#3a9cb5' })
  }

  // Humidity
  if (hum > 65) {
    advice.push({ icon: 'Droplets',      text: 'High humidity — run dehumidifier',                  priority: 'medium', color: '#c8893a' })
  } else if (hum < 30) {
    advice.push({ icon: 'Droplet',       text: 'Low humidity — use a humidifier',                   priority: 'low',    color: '#3a9cb5' })
  }

  // Sort: high → medium → low
  const order = { high: 0, medium: 1, low: 2 }
  advice.sort((a, b) => order[a.priority] - order[b.priority])

  return advice.slice(0, 5)
}

// ── ASHRAE Comfort Zone ─────────────────────────────────────
export const getComfortStatus = (temp, hum) => {
  if (temp == null || hum == null) return { inZone: null, label: 'Unknown' }
  const t = Number(temp), h = Number(hum)
  // ASHRAE 55 summer comfort zone: 22–27°C, 30–70% RH
  const inTemp = t >= 20 && t <= 27
  const inHum  = h >= 30 && h <= 65
  if (inTemp && inHum) return { inZone: true,  label: 'Comfortable' }
  if (inTemp || inHum) return { inZone: false, label: 'Slightly Outside' }
  return                      { inZone: false, label: 'Uncomfortable' }
}

// ── AQI label from value ────────────────────────────────────
export const aqiCategory = (v) => {
  if (v == null) return { label: '—', color: '#7878a0' }
  const n = Number(v)
  if (n <= 12)   return { label: 'Good',      color: '#3aaa6e' }
  if (n <= 35.4) return { label: 'Moderate',  color: '#c8893a' }
  if (n <= 55.4) return { label: 'Unhealthy for Sensitive', color: '#b86040' }
  return                 { label: 'Poor',      color: '#c05555' }
}
