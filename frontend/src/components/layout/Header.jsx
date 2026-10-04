/**
 * components/layout/Header.jsx
 *
 * Top header bar.
 * Patient info + digital clock. The sensor status badge is now rendered
 * inside Dashboard.jsx via SensorStatusBadge component.
 */
import { useClock } from '../../hooks/useClock'
import { User }     from 'lucide-react'

// ── Patient constants ────────────────────────────────────────────────────────
const PATIENT_NAME = 'Amitesh Jaiswal'
const PATIENT_ID   = 'P-2026'

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

      {/* Right spacer — sensor badge is now in Dashboard */}
      <div className="w-[140px]" />
    </header>
  )
}
