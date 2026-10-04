/**
 * hooks/useVitalsData.js
 *
 * Live data hook — connected to the CardioSense Node.js backend via Socket.io.
 *
 * Data flow:
 *   Python script → POST /api/vitals → server.js → io.emit('new_vitals')
 *                                                          ↓
 *                                          this hook (socket.on 'new_vitals')
 *                                                          ↓
 *                                     React components via returned state
 *
 * Connection states exposed:
 *   socketStatus:  'connecting' | 'connected' | 'disconnected' | 'error'
 *
 * Sensor-online state:
 *   sensorStatus:  { online: boolean, status: string }
 *   Driven by 'sensor_offline' events (server watchdog / bridge no-chest flag).
 *
 * Graceful fallback:
 *   The waveform continues its smooth sine animation locally between live
 *   payload pushes so the chart never looks frozen when the Python script
 *   sends data at a slow rate (e.g. 1 Hz). When the sensor is offline the
 *   animation pauses so the chart stays still and the offline placeholder shows.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

// ── Backend URL ───────────────────────────────────────────────────────────────
// Change this to your server's address when deploying outside localhost.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// ── Waveform constants ────────────────────────────────────────────────────────
const WAVEFORM_POINTS       = 80   // visible rolling window
const WAVEFORM_INTERVAL_MS  = 60   // local animation tick ~16 fps

// ── History constants ─────────────────────────────────────────────────────────
const HISTORY_MAX = 10             // matches backend .limit(10)

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Simulate a smooth BCG waveform tick (used for local animation between ticks) */
function generateWaveformPoint(tick) {
  const sine     = Math.sin(tick * 0.35) * 60
  const harmonic = Math.sin(tick * 0.8) * 18
  const noise    = (Math.random() - 0.5) * 8
  return parseFloat((sine + harmonic + noise).toFixed(2))
}

/** Generate a static sparkline dataset for the HRV card background */
export function generateSparkline(points = 20) {
  return Array.from({ length: points }, (_, i) => ({
    x: i,
    y: parseFloat((Math.sin(i * 0.5) * 10 + 45 + (Math.random() - 0.5) * 4).toFixed(2)),
  }))
}

/** Convert a raw MongoDB vital document to the shape the history table expects */
function docToRow(doc) {
  return {
    id:        doc._id,
    timestamp: new Date(doc.timestamp).toLocaleTimeString('en-US', { hour12: false }),
    avgHr:     doc.heartRate,
    hrv:       doc.hrv,
    amplitude: typeof doc.amplitude === 'number'
      ? doc.amplitude.toFixed(2) + 'g'
      : doc.amplitude,
    aiStatus:  doc.riskStatus === 1 ? 'Risk' : 'Stable',
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useVitalsData() {
  // ── Vitals state ───────────────────────────────────────────────────────────
  // Start at 0 — cards will show '--' until the first real reading arrives
  const [heartRate,     setHeartRate]     = useState(0)
  const [hrv,           setHrv]           = useState(0)
  const [breathingRate, setBreathingRate] = useState(null)
  const [riskStatus,    setRiskStatus]    = useState('stable')    // 'stable' | 'risk'
  const [socketStatus,  setSocketStatus]  = useState('connecting') // feeds the Header badge

  // Sensor online/offline state — tracks ESP32 chest-contact & data watchdog
  // Default to false so we don't show mock/fake animation before sensor connects
  const [sensorStatus, setSensorStatus] = useState({ online: false, status: 'Waiting for sensor...' })

  // sensorConnected — true when the ESP32 device is actively sending ANY data
  // sensorOnChest   — true only when the sensor is physically on the body
  // "Not Connected" is only shown when sensorConnected is false
  // "Keep Sensor Close" is shown when sensorConnected but !sensorOnChest
  const [sensorConnected, setSensorConnected] = useState(false)
  const [sensorOnChest,   setSensorOnChest]   = useState(false)
  const sensorConnectedRef = useRef(false)

  // ── Waveform state ─────────────────────────────────────────────────────────
  // Start with zero-amplitude data — real data fills in once sensor connects
  const [waveformData, setWaveformData] = useState(() =>
    Array.from({ length: WAVEFORM_POINTS }, (_, i) => ({
      x: i,
      y: 0,
    }))
  )

  // ── History table state ────────────────────────────────────────────────────
  const [history, setHistory] = useState([])

  const tickRef = useRef(WAVEFORM_POINTS)
  // Ref so the waveform animation interval can read sensor status without
  // recreating the interval on every sensorStatus change
  const sensorOnlineRef  = useRef(false)   // true only when on chest
  const sensorOnChestRef = useRef(false)   // alias for clarity in waveform

  // ── Helper: append one row to history, capped at HISTORY_MAX ──────────────
  const appendHistory = useCallback((doc) => {
    setHistory(prev => {
      const row  = docToRow(doc)
      // Avoid duplicate rows (can happen on StrictMode double-mount)
      const dupe = prev.some(r => r.id === row.id)
      if (dupe) return prev
      return [...prev.slice(-(HISTORY_MAX - 1)), row]
    })
  }, [])

  // ── 1. Seed history table from REST endpoint on mount ─────────────────────
  //   Called once so the table is pre-populated even before the Python script
  //   sends its first reading in this session.
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/vitals/history`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(docs => {
        // API returns newest-first; reverse so oldest row is at the top
        const rows = docs.map(docToRow).reverse()
        setHistory(rows)
      })
      .catch(err => {
        console.warn('[History seed] Could not fetch history:', err.message)
        // Non-fatal — table starts empty and fills via socket events
      })
  }, [])

  // ── 2. Socket.io live data connection ─────────────────────────────────────
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],  // prefer WS, fall back to polling
      reconnectionAttempts: 10,
      reconnectionDelay:    2000,
    })

    if (socket.connected) {
      setSocketStatus('connected')
    }

    // ── Lifecycle events ─────────────────────────────────────────────────────
    socket.on('connect', () => {
      console.log(`[Socket.io] ✅ Connected → id: ${socket.id}`)
      setSocketStatus('connected')
    })

    socket.on('disconnect', (reason) => {
      console.warn(`[Socket.io] ❌ Disconnected — reason: ${reason}`)
      setSocketStatus('disconnected')
      // Full disconnect — device is gone, mark both connected and on-chest as false
      sensorOnlineRef.current   = false
      sensorOnChestRef.current  = false
      sensorConnectedRef.current = false
      setSensorStatus({ online: false, status: 'disconnected' })
      setSensorConnected(false)
      setSensorOnChest(false)
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket.io] Connection error:', err.message)
      setSocketStatus('error')
    })

    socket.on('reconnect', (attempt) => {
      console.log(`[Socket.io] 🔄 Reconnected after ${attempt} attempt(s)`)
      setSocketStatus('connected')
    })

    // ── 'new_vitals' — pushed by server.js after every POST /api/vitals ─────
    //
    //   Payload shape (mirrors VitalSchema exactly):
    //   {
    //     _id:          string,
    //     timestamp:    string (ISO date),
    //     heartRate:    number,
    //     hrv:          number,
    //     amplitude:    number,
    //     riskStatus:   0 | 1,
    //     sensorOnline: boolean,
    //     status:       string,
    //     breathingRate:number | null,
    //   }
    socket.on('new_vitals', (payload) => {
      // Sensor is connected AND on body — update all vitals
      sensorOnlineRef.current    = true
      sensorOnChestRef.current   = true
      sensorConnectedRef.current = true
      setSensorStatus({ online: true, status: payload.status || '--' })
      setSensorConnected(true)
      setSensorOnChest(true)

      setHeartRate(payload.heartRate)
      setHrv(payload.hrv)
      setBreathingRate(payload.breathingRate ?? null)
      setRiskStatus(payload.riskStatus === 1 ? 'risk' : 'stable')

      // Anchor the waveform to the real amplitude from the sensor.
      // Amplitude from sensor is in milli-g (e.g. 0.81); scale ×100 to fit
      // the chart's ±90 y-axis range.
      tickRef.current += 1
      setWaveformData(prev => [
        ...prev.slice(1),
        { x: tickRef.current, y: payload.amplitude * 100 },
      ])

      // Append to the history table
      appendHistory(payload)
    })

    // ── 'sensor_offline' — emitted by server watchdog or bridge on no-chest ──
    //   This means: ESP32 is still running (sensorConnected=true) but NOT on body
    //   OR it's a 5s timeout (sensorConnected=false).
    socket.on('sensor_offline', (payload) => {
      const statusStr = (payload.status || '').toLowerCase()
      const isTimeout = statusStr.includes('timeout') || statusStr.includes('no data')

      console.warn('[Socket.io] ⚠ sensor_offline:', payload.status)
      sensorOnlineRef.current  = false
      sensorOnChestRef.current = false

      if (isTimeout) {
        // 5s watchdog fired — device may be fully gone
        sensorConnectedRef.current = false
        setSensorConnected(false)
        setSensorOnChest(false)
      } else {
        // Sensor chip is on but not on body (e.g. 'seene pe lagao', 'warmup')
        sensorConnectedRef.current = true
        setSensorConnected(true)
        setSensorOnChest(false)
      }

      setSensorStatus({ online: false, status: payload.status || 'sensor offline' })
      // NOTE: We intentionally keep the last heartRate/hrv values in state so
      // that if the card ever re-enables we resume gracefully.
    })

    return () => {
      console.log('[Socket.io] Disconnecting on unmount…')
      socket.disconnect()
    }
  }, [appendHistory])

  // ── 3. Local waveform animation between live socket ticks ─────────────────
  //   Keeps the chart visually smooth at ~16 fps regardless of how often the
  //   Python script sends data. Each real 'new_vitals' event will overwrite
  //   the last point with the true sensor amplitude (step 2 above).
  //   When the sensor is offline the animation pauses so the chart stays
  //   frozen and the offline placeholder renders properly.
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1
      if (sensorOnChestRef.current) {
        // Full live BCG waveform
        setWaveformData(prev => [
          ...prev.slice(1),
          { x: tickRef.current, y: generateWaveformPoint(tickRef.current) },
        ])
      } else if (sensorConnectedRef.current) {
        // Sensor on but not on body — show very low amplitude noise
        const lowNoise = (Math.random() - 0.5) * 6
        setWaveformData(prev => [
          ...prev.slice(1),
          { x: tickRef.current, y: lowNoise },
        ])
      }
      // If not connected at all — leave waveform frozen at zeros
    }, WAVEFORM_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return { heartRate, hrv, breathingRate, riskStatus, sensorStatus, waveformData, history, socketStatus, sensorConnected, sensorOnChest }
}
