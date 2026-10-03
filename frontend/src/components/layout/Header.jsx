/**
 * components/layout/Header.jsx
 *
 * Top header bar.
 * The SensorBadge reads live socket connection status from SocketContext —
 * it shows green/amber/red based on the actual backend connection, not just
 * a static label.
 */
import { useClock }         from '../../hooks/useClock'
import { useSocketContext } from '../../context/SocketContext'
import { User }             from 'lucide-react'
import { cn }               from '../../lib/utils'

// ── Patient constants ────────────────────────────────────────────────────────
const PATIENT_NAME = 'Amitesh Jaiswal'
const PATIENT_ID   = 'P-2026'

// ── Status config map ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  connecting:   {
    dot:   'bg-amber-400',
    pulse: 'bg-amber-400 animate-sensor-pulse',
    text:  'Connecting…',
    ring:  'border-zinc-700/60',
  },
  connected:    {
    dot:   'bg-green-500',
    pulse: 'bg-green-400 animate-sensor-pulse',
    text:  'Sensor Connected',
    ring:  'border-green-500/30',
  },
  disconnected: {
    dot:   'bg-zinc-500',
    pulse: 'bg-zinc-500',
    text:  'Disconnected',
    ring:  'border-zinc-700/60',
  },
  error:        {
    dot:   'bg-red-500',
    pulse: 'bg-red-400 animate-alert-pulse',
    text:  'Connection Error',
    ring:  'border-red-500/30',
  },
}

// ── SensorBadge ──────────────────────────────────────────────────────────────
function SensorBadge() {
  const { socketStatus } = useSocketContext()
  const cfg = STATUS_CONFIG[socketStatus] ?? STATUS_CONFIG.connecting

  return (
    <div
      id="sensor-status-badge"
      className={cn(
        'flex items-center gap-2.5 rounded-full',
        'bg-zinc-900 border px-4 py-2 text-sm font-medium text-zinc-300',
        'transition-all duration-500',
        cfg.ring,
      )}
    >
      {/* Animated dot */}
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
        <span className={cn(
          'absolute inline-flex h-full w-full rounded-full transition-colors duration-500',
          cfg.pulse,
        )} />
        <span className={cn(
          'relative inline-flex rounded-full h-2.5 w-2.5 transition-colors duration-500',
          cfg.dot,
        )} />
      </span>

      <span className="transition-all duration-300">{cfg.text}</span>
    </div>
  )
}

// ── Header ───────────────────────────────────────────────────────────────────
export default function Header() {
  const { date, time } = useClock()

  return (
    <header
      id="main-header"
      className="flex items-center justify-between
                 px-6 py-3
                 bg-zinc-950/80 border-b border-zinc-800/60
                 backdrop-blur-sm sticky top-0 z-30"
    >
      {/* Left – Patient Info */}
      <div id="patient-info" className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg
                        bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
          <User size={15} strokeWidth={2} />
        </div>
        <div>
          <p className="text-xs text-zinc-500 font-medium tracking-wider uppercase">Patient</p>
          <p className="text-sm font-semibold text-zinc-100 leading-tight">
            {PATIENT_NAME}
            <span className="ml-2 text-xs font-normal text-zinc-400">ID: {PATIENT_ID}</span>
          </p>
        </div>
      </div>

      {/* Center – Digital Clock */}
      <div id="clock-display" className="flex flex-col items-center">
        <span
          className="font-mono text-2xl font-bold tracking-widest
                     bg-gradient-to-r from-cyan-300 to-blue-400
                     bg-clip-text text-transparent"
        >
          {time}
        </span>
        <span className="text-xs text-zinc-500 mt-0.5 tracking-wide">{date}</span>
      </div>

      {/* Right – Live Sensor Badge */}
      <SensorBadge />
    </header>
  )
}
