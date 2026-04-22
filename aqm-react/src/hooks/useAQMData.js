import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export function useAQMData(refreshInterval = 5000) {
  const [readings, setReadings] = useState([])
  const [latest, setLatest] = useState(null)
  const [stats, setStats] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const prevAlertRef = useRef(false)

  const fetchAll = useCallback(async () => {
    try {
      const [rRes, sRes, fRes] = await Promise.allSettled([
        axios.get('http://51.21.86.143/api/readings?limit=30'),
        axios.get('http://51.21.86.143/api/stats'),
        axios.get('http://51.21.86.143/api/forecast')
      ])

      if (rRes.status === 'fulfilled' && rRes.value.data.success) {
        const data = rRes.value.data.readings
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
  }, [fetchAll, refreshInterval])

  return { readings, latest, stats, forecast, loading, lastUpdated, refetch: fetchAll }
}
