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
export const computeHealthScore = (reading, settings = {}) => {
  if (!reading) return null

  const s = {
    aqiWarn: 35, aqiAlert: 50,
    co2Warn: 1000, co2Alert: 2000,
    coWarn: 9, nh3Warn: 25,
    tempMin: 18, tempMax: 28,
    ...settings
  }

  const aqi  = Number(reading.aqi  ?? 0)
  const temp = Number(reading.temperature ?? 22)
  const hum  = Number(reading.humidity    ?? 50)
  const co2  = Number(reading.co2_ppm     ?? 400)
  const co   = Number(reading.co_ppm      ?? 0)
  const nh3  = Number(reading.nh3_ppm     ?? 0)

  // AQI sub-score 
  const aqiScore = aqi <= s.aqiWarn/2  ? 100
                 : aqi <= s.aqiWarn ? Math.round(100 - ((aqi - s.aqiWarn/2) / (s.aqiWarn/2)) * 40)
                 : Math.max(0, Math.round(60 - ((aqi - s.aqiWarn) / (s.aqiAlert - s.aqiWarn || 1)) * 60))

  // Temp comfort: 20–26°C ideal
  const tempDiff = Math.abs(temp - 23)
  const tempScore = Math.max(0, 100 - tempDiff * 10)

  // Humidity comfort: 40–60% ideal
  const humDiff = Math.max(0, Math.abs(hum - 50) - 10)
  const humScore = Math.max(0, 100 - humDiff * 5)

  // CO₂
  const co2Score = co2 <= s.co2Warn ? 100
                 : co2 <= s.co2Alert ? Math.round(100 - ((co2 - s.co2Warn) / (s.co2Alert - s.co2Warn || 1)) * 60)
                 : Math.max(0, 40 - ((co2 - s.co2Alert) / 1000) * 40)

  // CO
  const coScore = co <= s.coWarn  ? 100
                : co <= s.coWarn * 3.5 ? Math.round(100 - ((co - s.coWarn) / (s.coWarn * 2.5)) * 70)
                : 0

  // NH₃
  const nh3Score = nh3 <= s.nh3Warn ? 100
                 : nh3 <= s.nh3Warn * 2  ? Math.round(100 - ((nh3 - s.nh3Warn) / s.nh3Warn) * 60)
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
export const getVentilationAdvice = (reading, settings = {}) => {
  if (!reading) return []

  const s = {
    aqiWarn: 35, aqiAlert: 50,
    co2Warn: 1000, co2Alert: 2000,
    coWarn: 9, nh3Warn: 25,
    tempMin: 18, tempMax: 28,
    humMin: 30, humMax: 65,
    ...settings
  }

  const advice = []
  const aqi  = Number(reading.aqi  ?? 0)
  const temp = Number(reading.temperature ?? 22)
  const hum  = Number(reading.humidity    ?? 50)
  const co2  = Number(reading.co2_ppm     ?? 400)
  const co   = Number(reading.co_ppm      ?? 0)
  const nh3  = Number(reading.nh3_ppm     ?? 0)

  // AQI recommendations
  if (aqi > s.aqiAlert) {
    advice.push({ icon: 'DoorOpen',      text: 'Open windows immediately — AQI elevated', priority: 'high',   color: '#c05555' })
    advice.push({ icon: 'AirVent',       text: 'Run air purifier on high speed',          priority: 'high',   color: '#c05555' })
  } else if (aqi > s.aqiWarn) {
    advice.push({ icon: 'DoorOpen',      text: 'Consider ventilating — moderate AQI',    priority: 'medium', color: '#c8893a' })
  } else {
    advice.push({ icon: 'CheckCircle2',  text: 'Air quality is good — no action needed', priority: 'low',    color: '#3aaa6e' })
  }

  // CO₂
  if (co2 > s.co2Alert) {
    advice.push({ icon: 'Siren',         text: 'Critical CO₂ level — ventilate now!',              priority: 'high',   color: '#c05555' })
  } else if (co2 > s.co2Warn) {
    advice.push({ icon: 'Wind',          text: 'CO₂ elevated — increase air circulation',           priority: 'medium', color: '#c8893a' })
  }

  // CO
  if (co > s.coWarn * 3.5) {
    advice.push({ icon: 'Siren',         text: 'Dangerous CO levels — evacuate and ventilate!',    priority: 'high',   color: '#c05555' })
  } else if (co > s.coWarn) {
    advice.push({ icon: 'AlertTriangle', text: 'CO slightly elevated — check ventilation',          priority: 'medium', color: '#c8893a' })
  }

  // NH₃
  if (nh3 > s.nh3Warn * 2) {
    advice.push({ icon: 'CloudOff',      text: 'High ammonia — ventilate and check sources',        priority: 'medium', color: '#c8893a' })
  }

  // Temperature
  if (temp > s.tempMax) {
    advice.push({ icon: 'Snowflake',     text: 'Room is warm — consider AC or fan',                 priority: 'low',    color: '#3a9cb5' })
  } else if (temp < s.tempMin) {
    advice.push({ icon: 'Flame',         text: 'Room is cool — check heating',                      priority: 'low',    color: '#3a9cb5' })
  }

  // Humidity
  if (hum > s.humMax) {
    advice.push({ icon: 'Droplets',      text: 'High humidity — run dehumidifier',                  priority: 'medium', color: '#c8893a' })
  } else if (hum < s.humMin) {
    advice.push({ icon: 'Droplet',       text: 'Low humidity — use a humidifier',                   priority: 'low',    color: '#3a9cb5' })
  }

  // Sort: high → medium → low
  const order = { high: 0, medium: 1, low: 2 }
  advice.sort((a, b) => order[a.priority] - order[b.priority])

  return advice.slice(0, 5)
}

// ── ASHRAE Comfort Zone ─────────────────────────────────────
export const getComfortStatus = (temp, hum, settings = {}) => {
  if (temp == null || hum == null) return { inZone: null, label: 'Unknown' }
  const s = { tempMin: 20, tempMax: 27, humMin: 30, humMax: 65, ...settings }
  const t = Number(temp), h = Number(hum)
  const inTemp = t >= s.tempMin && t <= s.tempMax
  const inHum  = h >= s.humMin && h <= s.humMax
  if (inTemp && inHum) return { inZone: true,  label: 'Comfortable' }
  if (inTemp || inHum) return { inZone: false, label: 'Slightly Outside' }
  return                      { inZone: false, label: 'Uncomfortable' }
}

// ── AQI label from value ────────────────────────────────────
export const aqiCategory = (v, settings = {}) => {
  if (v == null) return { label: '—', color: '#7878a0' }
  const s = { aqiWarn: 35.4, aqiAlert: 55.4, ...settings }
  const n = Number(v)
  if (n <= s.aqiWarn)   return { label: 'Good',      color: '#3aaa6e' }
  if (n <= s.aqiAlert) return { label: 'Moderate',  color: '#c8893a' }
  return                 { label: 'Poor',      color: '#c05555' }
}
