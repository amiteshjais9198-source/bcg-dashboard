/**
 * components/vitals/SensorStatusBadge.jsx
 *
 * Sensor connection status indicator badge.
 * Shows a pulsing coloured dot + human-readable label.
 *
 * Props:
 *  sensorConnected (bool)   – ESP32 is actively sending ANY data (chip is live)
 *  sensorOnChest   (bool)   – sensor is physically pressed to the body
 *  status          (string) – raw status string from ESP32 / server
 *
 * Color / label logic:
 *  🟢 green   – connected & valid readings (on chest)
 *  🟡 yellow  – chip is live but NOT on body → "Keep Sensor Close"
 *  🟠 orange  – motion artifact / hilo
 *  🔵 blue    – warming up
 *  🔴 red     – fully disconnected / no data → "Not Connected"
 */
export default function SensorStatusBadge({ sensorConnected, sensorOnChest, status }) {
  const lc = (status || '').toLowerCase()

  const isMotion  = lc.includes('hilo')
  const isWarmup  = lc.includes('warmup')

  let dotColor  = 'bg-emerald-400'
  let label     = 'Sensor On Body'
  let textColor = 'text-emerald-400'
  let pingColor = 'bg-emerald-400'
  let icon      = '●'

  if (!sensorConnected) {
    // ESP32 not sending data at all
    dotColor  = 'bg-red-500';    pingColor = 'bg-red-500'
    label     = 'Not Connected'
    textColor = 'text-red-400'
  } else if (!sensorOnChest) {
    if (isWarmup) {
      dotColor  = 'bg-blue-400';  pingColor = 'bg-blue-400'
      label     = 'Warming Up…'
      textColor = 'text-blue-400'
    } else if (isMotion) {
      dotColor  = 'bg-orange-400'; pingColor = 'bg-orange-400'
      label     = 'Motion Detected'
      textColor = 'text-orange-400'
    } else {
      // Chip is live but not on body — use cyan to stay on theme
      dotColor  = 'bg-cyan-400'; pingColor = 'bg-cyan-400'
      label     = 'Place Sensor on Chest'
      textColor = 'text-cyan-400'
    }
  } else if (isMotion) {
    dotColor  = 'bg-orange-400';  pingColor = 'bg-orange-400'
    label     = 'Motion Detected'
    textColor = 'text-orange-400'
  }

  return (
    <div
      id="sensor-status-badge"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full
                 glass-card border border-zinc-700/40 transition-all duration-500"
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-60`}
        />
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`}
        />
      </span>

      {/* Label */}
      <span className={`text-xs font-semibold ${textColor} whitespace-nowrap`}>
        {label}
      </span>

      {/* Raw status string — visible on sm+ screens, only when connected */}
      {sensorConnected && status && status !== '--' && (
        <span className="text-xs text-zinc-500 hidden sm:inline truncate max-w-[160px]">
          · {status}
        </span>
      )}
    </div>
  )
}
