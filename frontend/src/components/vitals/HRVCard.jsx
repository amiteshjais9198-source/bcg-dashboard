/**
 * components/vitals/HRVCard.jsx
 *
 * Vital card – Heart Rate Variability (HRV).
 *
 * Props:
 *  value       (number)    – current HRV in ms
 *  sparkline   (array)     – [{x, y}] static sparkline dataset for visual context
 *
 * Features:
 *  - Subtle SVG sparkline rendered in the card background
 *  - Number flash micro-animation on change
 */
import { useRef, useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  YAxis,
} from 'recharts'

export default function HRVCard({ value, sparkline }) {
  const prevRef  = useRef(value)
  const [flashKey, setFlashKey] = useState(0)

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value
      setFlashKey(k => k + 1)
    }
  }, [value])

  return (
    <div
      id="card-hrv"
      className="glass-card rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden
                 animate-fade-slide-in animation-delay-200
                 hover:border-zinc-600/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.07)]
                 transition-all duration-200 ease-in-out cursor-default"
    >
      {/* Background sparkline – very subtle */}
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkline} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="hrvSparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#06b6d4" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <YAxis domain={['auto', 'auto']} hide />
            <Area
              type="monotone"
              dataKey="y"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#hrvSparkGrad)"
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Card header */}
      <div className="flex items-center gap-2.5 relative z-10">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg
                        bg-cyan-500/10 border border-cyan-500/20">
          <Activity size={16} className="text-cyan-400" strokeWidth={2} />
        </div>
        <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
          HR Variability
        </span>
      </div>

      {/* HRV value */}
      <div className="flex items-end gap-2 relative z-10">
        <span
          key={flashKey}
          id="hrv-value"
          className="font-bold text-white animate-number-flash"
          style={{ fontSize: 'clamp(2.5rem, 4vw, 3.75rem)', lineHeight: 1 }}
        >
          {value}
        </span>
        <span className="text-zinc-500 text-lg font-medium mb-1.5">ms</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-zinc-700/40 pt-3 relative z-10">
        <div className="text-xs text-zinc-500">
          Healthy: <span className="text-zinc-300">35–70 ms</span>
        </div>
        <div className="text-xs text-cyan-400 font-medium">Optimal</div>
      </div>
    </div>
  )
}
