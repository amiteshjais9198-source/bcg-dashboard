/**
 * components/charts/WaveformChart.jsx
 *
 * Real-time scrolling BCG (Ballistocardiography) waveform.
 *
 * Props:
 *  data  (array)  – [{x: number, y: number}] rolling window from useVitalsData
 *
 * Data source: Socket.io 'new_vitals' events from the CardioSense backend.
 * The waveform's y-axis is driven by `payload.amplitude × 100` (scaled to ±90).
 * Between live events, a smooth local sine animation keeps the chart active.
 */
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Radio } from 'lucide-react'

// ── Custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg px-3 py-1.5 text-xs border border-zinc-700/40">
        <span className="text-zinc-400">Amp: </span>
        <span className="text-cyan-300 font-mono font-semibold">
          {payload[0].value?.toFixed(2)}
        </span>
      </div>
    )
  }
  return null
}

// ── WaveformChart ─────────────────────────────────────────────────────────────
export default function WaveformChart({ data }) {
  return (
    <div
      id="waveform-chart-container"
      className="glass-card rounded-2xl p-5 flex flex-col gap-4
                 animate-fade-slide-in animation-delay-400"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg
                          bg-cyan-500/10 border border-cyan-500/20">
            <Radio size={16} className="text-cyan-400" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
              Live BCG Waveform
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              Ballistocardiography · Amplitude (mg) · Scrolling real-time feed
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 rounded-full bg-zinc-800/80
                        border border-zinc-700/50 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full
                             bg-cyan-400/80 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest">
            Live
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-52 animate-chart-glow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <filter id="waveGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(63,63,70,0.4)"
              vertical={false}
            />

            <XAxis
              dataKey="x"
              tick={false}
              axisLine={{ stroke: 'rgba(63,63,70,0.4)' }}
              tickLine={false}
            />

            <YAxis
              domain={[-90, 90]}
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(6,182,212,0.3)', strokeWidth: 1 }}
            />

            {/* Reference zero line */}
            {/* ↳ LIVE INTEGRATION: this Line will carry actual BCG amplitude data */}
            <Line
              type="monotone"
              dataKey="y"
              stroke="#06b6d4"          /* cyan-500 – medical waveform color */
              strokeWidth={2}
              dot={false}
              isAnimationActive={false} /* Disable for smooth real-time scrolling */
              filter="url(#waveGlow)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer metrics */}
      <div className="flex items-center gap-6 border-t border-zinc-700/40 pt-3 flex-wrap">
        {[
          { label: 'Sample Rate', value: '~16 Hz' },
          { label: 'Window',      value: '80 pts' },
          { label: 'Source',      value: 'BCG Sensor' },
          { label: 'Protocol',    value: 'Socket.io Live' },
        ].map(({ label, value }) => (
          <div key={label} className="text-xs">
            <span className="text-zinc-500">{label}: </span>
            <span className="text-zinc-300 font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
