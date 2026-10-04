/**
 * components/vitals/RiskCard.jsx
 *
 * AI Risk Prediction card.
 *
 * Props:
 *  status           ('stable' | 'risk')  – risk level driven by useVitalsData
 *  sensorConnected  (boolean)            – ESP32 is sending data (chip is live)
 *  sensorOnChest    (boolean)            – sensor is physically on the body
 *
 * States:
 *  sensorOnChest=true → show stable / risk state
 *  sensorConnected, !onChest → show "Place Sensor on Chest" hint
 *  !sensorConnected → show "Not Connected" grey state
 */
import { ShieldCheck, AlertTriangle, WifiOff, Wifi } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function RiskCard({ status = 'stable', sensorOnChest = false, sensorConnected = false }) {
  const isRisk       = sensorOnChest && status === 'risk'
  const isStable     = sensorOnChest && status === 'stable'
  const isIdle       = sensorConnected && !sensorOnChest  // chip on, not on body
  const isDisconnected = !sensorConnected

  return (
    <div
      id="card-ai-risk"
      className={cn(
        'glass-card rounded-2xl p-5 flex flex-col gap-4',
        'animate-fade-slide-in animation-delay-300',
        'transition-all duration-300 ease-in-out cursor-default',
        isRisk
          ? 'border-red-500/40   hover:border-red-500/60   hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]'
          : isDisconnected
            ? 'border-zinc-700/30 opacity-55'
            : isIdle
              ? 'border-cyan-500/15 opacity-75'
              : 'border-emerald-500/30 hover:border-zinc-600/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.07)]',
      )}
    >
      {/* Card header */}
      <div className="flex items-center gap-2.5">
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg border',
          isRisk
            ? 'bg-red-500/10 border-red-500/20'
            : isDisconnected
              ? 'bg-zinc-800/40 border-zinc-700/30'
              : isIdle
                ? 'bg-cyan-500/5 border-cyan-500/15'
                : 'bg-emerald-500/10 border-emerald-500/20',
        )}>
          {isRisk
            ? <AlertTriangle size={16} className="text-red-400"     strokeWidth={2} />
            : isDisconnected
              ? <WifiOff      size={16} className="text-zinc-600"    strokeWidth={2} />
              : isIdle
                ? <Wifi       size={16} className="text-cyan-400"    strokeWidth={2} />
                : <ShieldCheck size={16} className="text-emerald-400" strokeWidth={2} />
          }
        </div>
        <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
          AI Risk Prediction
        </span>
      </div>

      {/* ── DISCONNECTED STATE ─────────────────────────────────────── */}
      {isDisconnected && (
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-14 w-14 rounded-full bg-zinc-800/40" />
            <WifiOff size={32} className="text-zinc-600 relative z-10" strokeWidth={1.5} />
          </div>
          <span id="risk-status-label" className="text-xl font-bold text-zinc-500 tracking-tight">
            Not Connected
          </span>
          <span className="text-xs text-zinc-600 text-center max-w-[180px]">
            ESP32 is offline. Check your device.
          </span>
        </div>
      )}

      {/* ── IDLE STATE (chip on, not on body) ─────────────────────── */}
      {isIdle && (
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-14 w-14 rounded-full bg-cyan-500/5 animate-pulse" />
            <Wifi size={32} className="text-cyan-400/50 relative z-10" strokeWidth={1.5} />
          </div>
          <span id="risk-status-label" className="text-xl font-bold text-cyan-400/60 tracking-tight">
            Awaiting Signal
          </span>
          <span className="text-xs text-zinc-500 text-center max-w-[180px]">
            Place the sensor close to your chest to begin.
          </span>
        </div>
      )}

      {/* ── STABLE STATE ─────────────────────────────────────────── */}
      {isStable && (
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-14 w-14 rounded-full bg-emerald-500/10" />
            <ShieldCheck size={36} className="text-emerald-400 relative z-10" strokeWidth={1.75} />
          </div>
          <span id="risk-status-label" className="text-2xl font-bold text-emerald-400 tracking-tight">
            Stable / Normal
          </span>
          <span className="text-xs text-zinc-400 text-center max-w-[180px]">
            No anomalous cardiac patterns detected.
          </span>
        </div>
      )}

      {/* ── RISK STATE ────────────────────────────────────────────── */}
      {isRisk && (
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-16 w-16 rounded-full
                             bg-red-500/20 animate-alert-pulse" />
            <AlertTriangle size={36} className="text-red-400 relative z-10" strokeWidth={2} />
          </div>
          <span id="risk-status-label" className="text-2xl font-bold text-red-400 tracking-tight">
            Risk Detected
          </span>
          <span className="text-xs text-zinc-400 text-center max-w-[160px]">
            Irregular pattern detected. Review required immediately.
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-zinc-700/40 pt-3">
        <div className="text-xs text-zinc-500">Model: <span className="text-zinc-300">BCG-Net v2.1</span></div>
        <div className={cn(
          'text-xs font-semibold uppercase tracking-wide',
          isRisk         ? 'text-red-400 animate-pulse'  :
          isDisconnected ? 'text-zinc-600'               :
          isIdle         ? 'text-cyan-400/50'             :
                           'text-emerald-400',
        )}>
          {isRisk ? '⚠ Alert' : isDisconnected ? '— Offline' : isIdle ? '◌ Idle' : '✓ Clear'}
        </div>
      </div>
    </div>
  )
}
