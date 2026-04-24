import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useSettingsContext } from '../context/SettingsContext'

export function useAQMData(refreshInterval = 5000) {
  const [readings,    setReadings]    = useState([])
  const [latest,      setLatest]      = useState(null)
  const [stats,       setStats]       = useState(null)
  const [forecast,    setForecast]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const prevAlertRef = useRef(false)
  const { settings } = useSettingsContext()

  const fetchAll = useCallback(async () => {
    try {
      const [rRes, sRes, fRes] = await Promise.allSettled([
        axios.get('/api/readings?limit=30'),
        axios.get('/api/stats'),
        axios.get('/api/forecast')
      ])
      
      if (rRes.status === 'fulfilled' && rRes.value.data.success) {
        let data = rRes.value.data.readings
        // Override with custom settings
        data = data.map(r => {
          let isAlert = false;
          let label = r.label || 'good';
          
          const aqi = Number(r.aqi || 0);
          const co2 = Number(r.co2_ppm || 0);
          const temp = Number(r.temperature || 0);
          
          if (aqi >= settings.aqiAlert || co2 >= settings.co2Alert) {
            isAlert = true;
            label = 'poor';
          } else if (aqi >= settings.aqiWarn || co2 >= settings.co2Warn) {
            label = 'moderate';
          } else if (aqi < settings.aqiWarn && co2 < settings.co2Warn) {
            label = 'good';
          }
          
          return { ...r, is_alert: r.is_alert || isAlert, label };
        });
        
        setReadings([...data].reverse())
        const newest = data[0]
        setLatest(newest)
        if (newest?.is_alert && !prevAlertRef.current) {
          toast.error(
            `⚠ Poor air quality — AQI ${Number(newest.aqi).toFixed(1)}. Ventilate immediately.`,
            { duration: 7000, id: 'aqi-alert', style: { background: '#1a0a0a', color: '#ff5252', border: '1px solid rgba(255,82,82,0.3)', fontFamily: "'DM Sans', sans-serif" } }
          )
        }
        prevAlertRef.current = newest?.is_alert || false
      }
      
      if (sRes.status === 'fulfilled' && sRes.value.data.success) {
        setStats(sRes.value.data)
      }

      if (fRes.status === 'fulfilled' && fRes.value.data.success) {
        setForecast(fRes.value.data)
      } else {
        setForecast(null)
      }

      setLastUpdated(new Date().toLocaleTimeString())
      setLoading(false)
    } catch (err) {
      console.error('Fetch error:', err)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, refreshInterval)
    return () => clearInterval(id)
  }, [fetchAll, refreshInterval, settings.aqiWarn, settings.aqiAlert, settings.co2Warn, settings.co2Alert])

  return { readings, latest, stats, forecast, loading, lastUpdated, refetch: fetchAll }
}
