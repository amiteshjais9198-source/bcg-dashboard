/**
 * components/charts/WaveformChart.jsx
 *
 * Real-time scrolling BCG (Ballistocardiography) waveform.
 *
 * Props:
 *  data             (array)   – [{x: number, y: number}] rolling window from useVitalsData
 *  sensorConnected  (boolean) – ESP32 is sending ANY data (chip live)
 *  sensorOnChest    (boolean) – sensor is physically on the body
 *  status           (string)  – raw status string
 *
 * States:
 *  sensorOnChest=true                → full live BCG waveform (cyan, glow)
 *  sensorConnected=true, !onChest    → low-amplitude noise graph (dim yellow)
 *  sensorConnected=false             → "Not Connected" placeholder
 */
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { Radio, WifiOff, Wifi } from 'lucide-react'

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
export default function WaveformChart({ data, sensorConnected = false, sensorOnChest = false, status }) {
  // Decide display mode
  const showLive       = sensorOnChest
  const showLowPeak    = sensorConnected && !sensorOnChest
  const showDisconnected = !sensorConnected

  // Stroke / fill color based on mode
  const strokeColor = showLive ? '#22d3ee' : '#22d3ee'   // always cyan
  const gradId      = showLive ? 'bcgGrad' : 'bcgGradLow'

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
            <Radio
              size={16}
              className={showLive ? 'text-cyan-400' : showLowPeak ? 'text-cyan-400' : 'text-zinc-600'}
              strokeWidth={2}
            />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
              Live BCG Waveform
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {showLive
                ? 'Ballistocardiography · Amplitude (mg) · Scrolling real-time feed'
                : showLowPeak
                  ? 'Sensor active · Place sensor on chest for full reading'
                  : 'No signal · ESP32 not connected'}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        {showLive ? (
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
        ) : showLowPeak ? (
          <div className="flex items-center gap-2 rounded-full bg-zinc-800/80
                          border border-cyan-500/20 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full
                               bg-cyan-400/40 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400/50" />
            </span>
            <span className="text-[10px] font-semibold text-cyan-500 uppercase tracking-widest">
              Idle
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-800/40
                          border border-zinc-700/30 px-3 py-1">
            <WifiOff size={10} className="text-zinc-500" />
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              Not Connected
            </span>
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="h-52 relative">
        {showDisconnected ? (
          /* ── Not Connected placeholder ────────────────────────── */
          <div className="h-full flex items-center justify-center flex-col gap-3 opacity-50">
            <WifiOff className="w-10 h-10 text-zinc-600" />
            <p className="text-zinc-400 text-sm font-semibold">Not Connected</p>
            <p className="text-zinc-600 text-xs text-center max-w-[220px]">
              ESP32 is not sending data. Check your device and network connection.
            </p>
          </div>
        ) : (
          /* ── Waveform: full BCG or low-peak idle ──────────────── */
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                {/* Full-live gradient (cyan) */}
                <linearGradient id="bcgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}    />
                </linearGradient>
                {/* Idle / low-peak gradient (cyan, very faint) */}
                <linearGradient id="bcgGradLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}    />
                </linearGradient>
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
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />

              <XAxis dataKey="x" hide />
              <YAxis domain={showLive ? ['auto', 'auto'] : [-15, 15]} hide />

              <Tooltip
                content={showLive ? <CustomTooltip /> : null}
                cursor={showLive ? { stroke: 'rgba(6,182,212,0.3)', strokeWidth: 1 } : false}
              />

              <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />

              <Area
                type="monotone"
                dataKey="y"
                stroke={strokeColor}
                strokeWidth={showLive ? 1.5 : 1}
                fill={`url(#${gradId})`}
                dot={false}
                isAnimationActive={false}
                filter={showLive ? 'url(#waveGlow)' : undefined}
                strokeOpacity={showLive ? 1 : 0.45}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* "Place sensor on chest" overlay hint when low-peak */}
        {showLowPeak && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 bg-zinc-900/70 border border-cyan-500/20
                            rounded-full px-4 py-1.5 backdrop-blur-sm">
              <Wifi size={13} className="text-cyan-400" />
              <span className="text-[11px] font-semibold text-cyan-300 tracking-wide">
                Place sensor on chest for readings
              </span>
            </div>
          </div>
        )}
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
