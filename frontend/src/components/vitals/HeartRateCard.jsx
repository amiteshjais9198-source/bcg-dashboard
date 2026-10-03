/**
 * components/vitals/HeartRateCard.jsx
 *
 * Vital card – Heart Rate (BPM).
 *
 * Props:
 *  value  (number)  – current BPM reading
 *
 * Features:
 *  - Pulsing red heart icon animation (CSS: animate-heartbeat)
 *  - Number flash micro-animation on value change via key trick
 *  - Trend indicator badge
 */
import { useRef, useEffect, useState } from 'react'
import { Heart, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/utils'

// Zone classification based on BPM
function getZone(bpm) {
  if (bpm < 60) return { label: 'Low',    color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25' }
  if (bpm > 100) return { label: 'High',  color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25' }
  return             { label: 'Normal',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' }
}

export default function HeartRateCard({ value }) {
  const prevRef   = useRef(value)
  const [flashKey, setFlashKey] = useState(0)

  // Trigger flash animation on every value change
  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value
      setFlashKey(k => k + 1)
    }
  }, [value])

  const zone = getZone(value)

  return (
    <div
      id="card-heart-rate"
      className="glass-card rounded-2xl p-5 flex flex-col gap-4
                 animate-fade-slide-in animation-delay-100
                 hover:border-zinc-600/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.07)]
                 transition-all duration-200 ease-in-out cursor-default"
    >
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg
                          bg-red-500/10 border border-red-500/20">
            <Heart
              size={16}
              className="text-red-400 animate-heartbeat fill-red-400/60"
              strokeWidth={0}
            />
          </div>
          <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Heart Rate
          </span>
        </div>

        {/* Zone badge */}
        <span className={cn(
          'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide border',
          zone.color, zone.bg, zone.border
        )}>
          {zone.label}
        </span>
      </div>

      {/* BPM value – re-keyed on change to trigger flash */}
      <div className="flex items-end gap-2">
        <span
          key={flashKey}
          id="heart-rate-value"
          className="font-bold text-white animate-number-flash"
          style={{ fontSize: 'clamp(2.5rem, 4vw, 3.75rem)', lineHeight: 1 }}
        >
          {value}
        </span>
        <span className="text-zinc-500 text-lg font-medium mb-1.5">BPM</span>
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between border-t border-zinc-700/40 pt-3">
        <div className="text-xs text-zinc-500">
          Range: <span className="text-zinc-300">60–100 BPM</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-400">
          <TrendingUp size={12} />
          <span>Steady</span>
        </div>
      </div>
    </div>
  )
}
