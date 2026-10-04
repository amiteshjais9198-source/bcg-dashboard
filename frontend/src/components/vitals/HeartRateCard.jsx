/**
 * components/vitals/HeartRateCard.jsx
 *
 * Vital card – Heart Rate (BPM).
 *
 * Props:
 *  value            (number)   – current BPM reading
 *  sensorConnected  (boolean)  – ESP32 is sending data (chip is live)
 *  sensorOnChest    (boolean)  – sensor is physically on body (valid readings)
 *
 * Display states:
 *  sensorOnChest=true  → show live BPM value with zone badge
 *  sensorConnected, !onChest → show '--', hint "Place sensor on chest"
 *  !sensorConnected    → show '--', hint "Not Connected"
 */
import { useRef, useEffect, useState } from 'react'
import { Heart, TrendingUp, WifiOff, Wifi } from 'lucide-react'
import { cn } from '../../lib/utils'

// Zone classification based on BPM
function getZone(bpm) {
  if (bpm < 60) return { label: 'Low',    color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25' }
  if (bpm > 100) return { label: 'High',  color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25' }
  return             { label: 'Normal',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' }
}

export default function HeartRateCard({ value, sensorOnChest = false, sensorConnected = false }) {
  const prevRef   = useRef(value)
  const [flashKey, setFlashKey] = useState(0)

  // Trigger flash animation on every value change (only when on chest)
  useEffect(() => {
    if (sensorOnChest && prevRef.current !== value) {
      prevRef.current = value
      setFlashKey(k => k + 1)
    }
  }, [value, sensorOnChest])

  // Use '--' when sensor is not on chest or value is invalid
  const displayValue = sensorOnChest && value > 0 ? Math.round(value) : '--'
  const zone = (sensorOnChest && value > 0) ? getZone(value) : null

  const footerHint = !sensorConnected
    ? <div className="text-xs text-red-500/70 flex items-center gap-1"><WifiOff size={10} />Not Connected</div>
    : !sensorOnChest
      ? <div className="text-xs text-cyan-400/70 flex items-center gap-1"><Wifi size={10} />Place sensor on chest</div>
      : zone
        ? <div className={cn('flex items-center gap-1 text-xs font-medium', zone.color)}><TrendingUp size={12} /><span>Steady</span></div>
        : <div className="text-xs text-zinc-500">--</div>

  return (
    <div
      id="card-heart-rate"
      className={cn(
        'glass-card rounded-2xl p-5 flex flex-col gap-4',
        'animate-fade-slide-in animation-delay-100',
        'transition-all duration-200 ease-in-out cursor-default',
        sensorOnChest
          ? 'hover:border-zinc-600/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.07)]'
          : sensorConnected
            ? 'hover:border-zinc-600/40 opacity-75'
            : 'opacity-55 border-zinc-700/30',
      )}
    >
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg
                          bg-red-500/10 border border-red-500/20">
            <Heart
              size={16}
              className={cn('text-red-400 fill-red-400/60', sensorOnChest ? 'animate-heartbeat' : '')}
              strokeWidth={0}
            />
          </div>
          <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Heart Rate
          </span>
        </div>

        {/* Zone badge */}
        {zone ? (
          <span className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide border',
            zone.color, zone.bg, zone.border
          )}>
            {zone.label}
          </span>
        ) : (
          <span className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide border flex items-center gap-1',
            !sensorConnected
              ? 'text-red-500/60 bg-red-500/5 border-red-500/20'
              : 'text-cyan-400/70 bg-cyan-500/5 border-cyan-500/20',
          )}>
            {!sensorConnected ? <><WifiOff size={9} />Offline</> : <><Wifi size={9} />Idle</>}
          </span>
        )}
      </div>

      {/* BPM value – re-keyed on change to trigger flash */}
      <div className="flex items-end gap-2">
        <span
          key={flashKey}
          id="heart-rate-value"
          className={cn(
            'font-bold animate-number-flash',
            sensorOnChest && value > 0 ? 'text-white' : 'text-zinc-600',
          )}
          style={{ fontSize: 'clamp(2.5rem, 4vw, 3.75rem)', lineHeight: 1 }}
        >
          {displayValue}
        </span>
        <span className="text-zinc-500 text-lg font-medium mb-1.5">BPM</span>
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between border-t border-zinc-700/40 pt-3">
        <div className="text-xs text-zinc-500">
          Range: <span className="text-zinc-300">60–100 BPM</span>
        </div>
        {footerHint}
      </div>
    </div>
  )
}
