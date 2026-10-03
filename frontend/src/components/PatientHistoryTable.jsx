/**
 * components/PatientHistoryTable.jsx
 *
 * Displays the last N readings in a clean dark table.
 *
 * Props:
 *  rows  (array)  – history entries from useVitalsData
 *    { id, timestamp, avgHr, hrv, amplitude, aiStatus }
 */
import { ClipboardList } from 'lucide-react'
import { cn } from '../lib/utils'

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const isRisk = status?.toLowerCase().includes('risk')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
        'text-[10px] font-semibold uppercase tracking-wide border',
        isRisk
          ? 'bg-red-500/10 text-red-400 border-red-500/25'
          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      )}
    >
      <span className={cn(
        'inline-block h-1.5 w-1.5 rounded-full',
        isRisk ? 'bg-red-400 animate-pulse' : 'bg-emerald-400',
      )} />
      {status}
    </span>
  )
}

// ── Column definitions ────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'timestamp', label: 'Timestamp',   className: 'text-left' },
  { key: 'avgHr',     label: 'Avg HR (BPM)', className: 'text-center' },
  { key: 'hrv',       label: 'HRV (ms)',     className: 'text-center' },
  { key: 'amplitude', label: 'Amplitude',    className: 'text-center' },
  { key: 'aiStatus',  label: 'AI Status',    className: 'text-right'  },
]

// ── Table ─────────────────────────────────────────────────────────────────────
export default function PatientHistoryTable({ rows = [] }) {
  return (
    <div
      id="patient-history-table"
      className="glass-card rounded-2xl p-5 flex flex-col gap-4
                 animate-fade-slide-in animation-delay-500"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg
                        bg-indigo-500/10 border border-indigo-500/20">
          <ClipboardList size={16} className="text-indigo-400" strokeWidth={2} />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Patient History
          </p>
          <p className="text-[10px] text-zinc-600 mt-0.5">
            Last {rows.length} readings · Auto-updating
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-700/60">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'py-2 pb-3 text-[10px] font-semibold tracking-widest',
                    'text-zinc-500 uppercase px-3',
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-zinc-800/60 transition-colors duration-150',
                  'hover:bg-zinc-800/40',
                  idx === rows.length - 1 && 'border-none', // last row no border
                )}
              >
                <td className="py-3 px-3 font-mono text-cyan-400/90 text-xs">
                  {row.timestamp}
                </td>
                <td className="py-3 px-3 text-center font-semibold text-zinc-200">
                  {row.avgHr}
                </td>
                <td className="py-3 px-3 text-center text-zinc-300">
                  {row.hrv}
                </td>
                <td className="py-3 px-3 text-center text-zinc-300">
                  {row.amplitude}
                </td>
                <td className="py-3 px-3 text-right">
                  <StatusBadge status={row.aiStatus} />
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-600 text-xs">
                  No readings yet…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
