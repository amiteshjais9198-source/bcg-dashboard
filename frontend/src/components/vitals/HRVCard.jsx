/**
 * components/vitals/HRVCard.jsx
 *
 * Vital card – Heart Rate Variability (HRV).
 *
 * Props:
 *  value            (number)    – current HRV in ms
 *  sparkline        (array)     – [{x, y}] static sparkline dataset
 *  sensorConnected  (boolean)   – ESP32 is sending data (chip is live)
 *  sensorOnChest    (boolean)   – sensor is physically on the body (valid readings)
 */
import { useRef, useEffect, useState } from 'react'
import { Activity, WifiOff, Wifi } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  YAxis,
} from 'recharts'
import { cn } from '../../lib/utils'

function getHrvZone(hrv) {
  if (hrv < 20)  return { label: 'Very Low', color: 'text-red-400' }
  if (hrv < 35)  return { label: 'Low',      color: 'text-amber-400' }
  if (hrv <= 70) return { label: 'Optimal',  color: 'text-emerald-400' }
  return               { label: 'High',      color: 'text-blue-400' }
}

export default function HRVCard({ value, sparkline, sensorOnChest = false, sensorConnected = false }) {
  const prevRef  = useRef(value)
  const [flashKey, setFlashKey] = useState(0)

  useEffect(() => {
    if (sensorOnChest && prevRef.current !== value) {
      prevRef.current = value
      setFlashKey(k => k + 1)
    }
  }, [value, sensorOnChest])

  const displayValue = sensorOnChest && value > 0 ? Math.round(value) : '--'
  const zone = (sensorOnChest && value > 0) ? getHrvZone(value) : null

  const footerRight = !sensorConnected
    ? <div className="text-xs text-red-500/70 flex items-center gap-1"><WifiOff size={10} />Not Connected</div>
    : !sensorOnChest
      ? <div className="text-xs text-cyan-400/70 flex items-center gap-1"><Wifi size={10} />Place sensor on chest</div>
      : <div className={cn('text-xs font-medium', zone?.color ?? 'text-zinc-500')}>{zone?.label ?? '--'}</div>

  return (
    <div
      id="card-hrv"
      className={cn(
        'glass-card rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden',
        'animate-fade-slide-in animation-delay-200',
        'transition-all duration-200 ease-in-out cursor-default',
        sensorOnChest
          ? 'hover:border-zinc-600/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.07)]'
          : sensorConnected
            ? 'hover:border-zinc-600/40 opacity-75'
            : 'opacity-55 border-zinc-700/30',
      )}
    >
      {/* Background sparkline – very subtle, only when on chest */}
      {sensorOnChest && (
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
      )}

      {/* Card header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg
                          bg-cyan-500/10 border border-cyan-500/20">
            <Activity size={16} className="text-cyan-400" strokeWidth={2} />
          </div>
          <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            HR Variability
          </span>
        </div>

        {/* Zone badge */}
        {zone ? (
          <span className={cn('text-[10px] font-semibold uppercase tracking-wide', zone.color)}>
            {zone.label}
          </span>
        ) : (
          <span className={cn(
            'text-[10px] flex items-center gap-1',
            !sensorConnected ? 'text-red-500/60' : 'text-cyan-400/60',
          )}>
            {!sensorConnected ? <><WifiOff size={9} />Offline</> : <><Wifi size={9} />Idle</>}
          </span>
        )}
      </div>

      {/* HRV value */}
      <div className="flex items-end gap-2 relative z-10">
        <span
          key={flashKey}
          id="hrv-value"
          className={cn(
            'font-bold animate-number-flash',
            sensorOnChest && value > 0 ? 'text-white' : 'text-zinc-600',
          )}
          style={{ fontSize: 'clamp(2.5rem, 4vw, 3.75rem)', lineHeight: 1 }}
        >
          {displayValue}
        </span>
        <span className="text-zinc-500 text-lg font-medium mb-1.5">ms</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-zinc-700/40 pt-3 relative z-10">
        <div className="text-xs text-zinc-500">
          Healthy: <span className="text-zinc-300">35–70 ms</span>
        </div>
        {footerRight}
      </div>
    </div>
  )
}
