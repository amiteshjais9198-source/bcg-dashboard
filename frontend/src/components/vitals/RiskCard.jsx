/**
 * components/vitals/RiskCard.jsx
 *
 * AI Risk Prediction card.
 *
 * Props:
 *  status  ('stable' | 'risk')  – risk level driven by useVitalsData
 *
 * ─── HOW TO TRIGGER THE RISK STATE ──────────────────────────────────────────
 *
 * From the parent (App.jsx or any page), pass  status="risk"  to this component.
 *
 * In useVitalsData.js, uncommenting this line inside the vitals interval will
 * randomly toggle the state ~10% of the time:
 *
 *   setRiskStatus(Math.random() < 0.1 ? 'risk' : 'stable')
 *
 * Or, when integrating with a live backend, map the incoming payload:
 *
 *   socket.on('vitals_update', (payload) => {
 *     setRiskStatus(payload.risk)   // expects 'stable' | 'risk'
 *   })
 *
 * WHAT THE RISK STATE RENDERS (shown in commented JSX below):
 *
 * {status === 'risk' && (
 *   <div className="flex flex-col items-center justify-center gap-3 py-2">
 *     <div className="relative flex items-center justify-center">
 *       <span className="absolute inline-flex h-16 w-16 rounded-full bg-red-500/20 animate-alert-pulse" />
 *       <AlertTriangle size={36} className="text-red-400 relative z-10" strokeWidth={2} />
 *     </div>
 *     <span className="text-3xl font-bold text-red-400 tracking-tight">Risk Detected</span>
 *     <span className="text-xs text-zinc-400 text-center max-w-[160px]">
 *       Irregular pattern detected. Review required immediately.
 *     </span>
 *   </div>
 * )}
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function RiskCard({ status = 'stable' }) {
  const isRisk = status === 'risk'

  return (
    <div
      id="card-ai-risk"
      className={cn(
        'glass-card rounded-2xl p-5 flex flex-col gap-4',
        'animate-fade-slide-in animation-delay-300',
        'transition-all duration-300 ease-in-out cursor-default',
        isRisk
          ? 'border-red-500/40   hover:border-red-500/60   hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]'
          : 'border-emerald-500/30 hover:border-zinc-600/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.07)]',
      )}
    >
      {/* Card header */}
      <div className="flex items-center gap-2.5">
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg border',
          isRisk
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-emerald-500/10 border-emerald-500/20',
        )}>
          {isRisk
            ? <AlertTriangle size={16} className="text-red-400"     strokeWidth={2} />
            : <ShieldCheck   size={16} className="text-emerald-400" strokeWidth={2} />
          }
        </div>
        <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
          AI Risk Prediction
        </span>
      </div>

      {/* ── STABLE STATE ─────────────────────────────────────────── */}
      {!isRisk && (
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-14 w-14 rounded-full bg-emerald-500/10" />
            <ShieldCheck
              size={36}
              className="text-emerald-400 relative z-10"
              strokeWidth={1.75}
            />
          </div>
          <span
            id="risk-status-label"
            className="text-2xl font-bold text-emerald-400 tracking-tight"
          >
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
            <AlertTriangle
              size={36}
              className="text-red-400 relative z-10"
              strokeWidth={2}
            />
          </div>
          <span
            id="risk-status-label"
            className="text-2xl font-bold text-red-400 tracking-tight"
          >
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
          isRisk ? 'text-red-400 animate-pulse' : 'text-emerald-400',
        )}>
          {isRisk ? '⚠ Alert' : '✓ Clear'}
        </div>
      </div>
    </div>
  )
}
