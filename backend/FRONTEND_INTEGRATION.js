/**
 * FRONTEND SOCKET.IO INTEGRATION GUIDE
 * ─────────────────────────────────────────────────────────────────────────────
 * File to edit:  src/hooks/useVitalsData.js
 *
 * STEP 1:  Install the Socket.io client in the frontend project
 *
 *   cd ../frontend
 *   npm install socket.io-client
 *
 * STEP 2:  Add this import at the top of useVitalsData.js
 *
 *   import { io } from 'socket.io-client'
 *
 * STEP 3:  Replace ALL three setInterval blocks with the socket listener below.
 *          The socket event 'new_vitals' is emitted by POST /api/vitals in
 *          server.js immediately after each MongoDB save.
 *
 * ─── DROP-IN REPLACEMENT for the three useEffect blocks ─────────────────────
 *
 *   const BACKEND_URL = 'http://localhost:5000'
 *
 *   useEffect(() => {
 *     // ── Connect once on mount ────────────────────────────────────────────
 *     const socket = io(BACKEND_URL, {
 *       withCredentials: true,
 *       transports: ['websocket', 'polling'],
 *     })
 *
 *     socket.on('connect', () => {
 *       console.log('[Socket.io] Connected to CardioSense backend →', socket.id)
 *     })
 *
 *     // ── Live vitals pushed from Python via server.js ─────────────────────
 *     // payload shape: { heartRate, hrv, amplitude, riskStatus, timestamp, _id }
 *     socket.on('new_vitals', (payload) => {
 *       setHeartRate(payload.heartRate)
 *       setHrv(payload.hrv)
 *
 *       // riskStatus is numeric: 0 = Normal, 1 = Risk Detected
 *       setRiskStatus(payload.riskStatus === 1 ? 'risk' : 'stable')
 *
 *       // Advance the waveform by one point using the sensor amplitude
 *       tickRef.current += 1
 *       setWaveformData(prev => [
 *         ...prev.slice(1),
 *         { x: tickRef.current, y: payload.amplitude * 100 },  // scale to chart range
 *       ])
 *
 *       // Append to history table (keep last HISTORY_MAX rows)
 *       const ts = new Date(payload.timestamp).toLocaleTimeString('en-US', { hour12: false })
 *       setHistory(prev => [
 *         ...prev.slice(-(HISTORY_MAX - 1)),
 *         {
 *           id:        payload._id,
 *           timestamp: ts,
 *           avgHr:     payload.heartRate,
 *           hrv:       payload.hrv,
 *           amplitude: payload.amplitude.toFixed(2) + 'g',
 *           aiStatus:  payload.riskStatus === 1 ? 'Risk' : 'Stable',
 *         },
 *       ])
 *     })
 *
 *     socket.on('disconnect', () => {
 *       console.warn('[Socket.io] Disconnected from backend')
 *     })
 *
 *     socket.on('connect_error', (err) => {
 *       console.error('[Socket.io] Connection error:', err.message)
 *     })
 *
 *     return () => socket.disconnect()   // cleanup on unmount
 *
 *   }, [])  // empty deps array — connect once
 *
 * ─── SEED HISTORY TABLE ON MOUNT ─────────────────────────────────────────────
 *
 *   Add this separate useEffect to pre-populate the history table from MongoDB
 *   when the dashboard first loads (so it's not empty until the Python loop runs):
 *
 *   useEffect(() => {
 *     fetch(`${BACKEND_URL}/api/vitals/history`)
 *       .then(r => r.json())
 *       .then(data => {
 *         const rows = data.map(d => ({
 *           id:        d._id,
 *           timestamp: new Date(d.timestamp).toLocaleTimeString('en-US', { hour12: false }),
 *           avgHr:     d.heartRate,
 *           hrv:       d.hrv,
 *           amplitude: d.amplitude.toFixed(2) + 'g',
 *           aiStatus:  d.riskStatus === 1 ? 'Risk' : 'Stable',
 *         }))
 *         setHistory(rows.reverse())   // API returns newest-first, table shows oldest-first
 *       })
 *       .catch(err => console.error('[History fetch]', err))
 *   }, [])
 *
 * ─── PYTHON SCRIPT PAYLOAD FORMAT ────────────────────────────────────────────
 *
 *   The Python hardware-listener script should POST this JSON to
 *   http://localhost:5000/api/vitals  with Content-Type: application/json
 *
 *   {
 *     "heartRate":  74,      // integer BPM
 *     "hrv":        46,      // integer ms
 *     "amplitude":  0.81,    // float milli-g
 *     "riskStatus": 0        // 0 = Normal | 1 = Risk Detected  (optional, defaults 0)
 *   }
 *
 *   Minimal Python example:
 *
 *   import requests, time
 *
 *   SERVER = 'http://localhost:5000/api/vitals'
 *
 *   while True:
 *       payload = {
 *           'heartRate':  sensor.get_hr(),
 *           'hrv':        sensor.get_hrv(),
 *           'amplitude':  sensor.get_amplitude(),
 *           'riskStatus': int(model.predict()),
 *       }
 *       try:
 *           r = requests.post(SERVER, json=payload, timeout=2)
 *           print(f'[{r.status_code}] Sent: {payload}')
 *       except Exception as e:
 *           print(f'[ERROR] {e}')
 *       time.sleep(1)    # 1 Hz update rate — adjust to match your sensor
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
