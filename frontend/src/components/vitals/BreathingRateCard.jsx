/**
 * components/vitals/BreathingRateCard.jsx
 *
 * Displays estimated breathing rate derived from ESP32 respPeak data.
 * Normal range: 12–20 breaths/min
 *
 * Props:
 *  value        (number | null)  – breathing rate in breaths/min
 *  sensorOnline (boolean)        – false when ESP32 sensor is off-chest / offline
 */
import { Wind, WifiOff } from 'lucide-react'
import { cn } from '../../lib/utils'

function getBreathZone(rate) {
  if (!rate || rate <= 0) return null
  if (rate < 10)  return { label: 'Very Low', color: 'text-blue-500',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'  }
  if (rate < 12)  return { label: 'Low',      color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20'  }
  if (rate <= 20) return { label: 'Normal',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20'}
  if (rate <= 24) return { label: 'High',     color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' }
  return               { label: 'Very High', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'   }
}

export default function BreathingRateCard({ value, sensorOnline = true }) {
  const zone    = (sensorOnline && value > 0) ? getBreathZone(value) : null
  const display = (sensorOnline && value > 0) ? Math.round(value) : '--'

  return (
    <div
      id="card-breathing-rate"
      className={cn(
        'glass-card rounded-2xl p-5 flex flex-col gap-3',
        'animate-fade-slide-in animation-delay-300',
        'transition-all duration-200 ease-in-out cursor-default',
        sensorOnline
          ? 'hover:border-zinc-600/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.08)]'
          : 'opacity-60 border-zinc-700/30',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg
                          bg-teal-500/10 border border-teal-500/20">
            <Wind className={cn('w-4 h-4', sensorOnline ? 'text-teal-400' : 'text-zinc-600')} />
          </div>
          <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Breathing Rate
          </span>
        </div>

        {/* Zone badge or offline badge */}
        {zone ? (
          <span className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide border',
            zone.color, zone.bg, zone.border,
          )}>
            {zone.label}
          </span>
        ) : sensorOnline ? (
          <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wide">
            estimate
          </span>
        ) : (
          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
            <WifiOff size={9} />
            Offline
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span
          id="breathing-rate-value"
          className={cn(
            'font-bold font-mono leading-none',
            sensorOnline && value > 0 ? 'text-white' : 'text-zinc-600',
          )}
          style={{ fontSize: 'clamp(2.5rem, 4vw, 3.75rem)', lineHeight: 1 }}
        >
          {display}
        </span>
        {display !== '--' && (
          <span className="text-zinc-400 text-sm mb-1">breaths/min</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-zinc-700/40 pt-3">
        <div className="text-xs text-zinc-500">
          Normal: <span className="text-zinc-300">12–20 /min</span>
        </div>
        {sensorOnline ? (
          zone ? (
            <div className={cn('text-xs font-medium', zone.color)}>{zone.label}</div>
          ) : (
            <div className="text-xs text-zinc-600">Place sensor on chest</div>
          )
        ) : (
          <div className="text-xs text-zinc-600">Place sensor on chest</div>
        )}
      </div>
    </div>
  )
}
