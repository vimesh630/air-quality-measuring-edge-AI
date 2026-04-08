import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export function useAQMData(refreshInterval = 5000) {
  const [readings,    setReadings]    = useState([])
  const [latest,      setLatest]      = useState(null)
  const [stats,       setStats]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const prevAlertRef = useRef(false)

  const fetchAll = useCallback(async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        axios.get('/api/readings?limit=30'),
        axios.get('/api/stats')
      ])
      if (rRes.data.success) {
        const data = rRes.data.readings
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
      if (sRes.data.success) setStats(sRes.data)
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

  return { readings, latest, stats, loading, lastUpdated, refetch: fetchAll }
}
