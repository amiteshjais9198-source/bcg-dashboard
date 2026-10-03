/**
 * pages/Dashboard.jsx
 *
 * Live Dashboard page — assembles all vitals components.
 * Receives live data from useVitalsData() (Socket.io + REST seed).
 * Reports socketStatus up to App via onSocketStatus prop so the
 * Header badge (which sits outside this component) stays in sync.
 */
import { useEffect }                        from 'react'
import { useVitalsData, generateSparkline } from '../hooks/useVitalsData'
import HeartRateCard       from '../components/vitals/HeartRateCard'
import HRVCard             from '../components/vitals/HRVCard'
import RiskCard            from '../components/vitals/RiskCard'
import WaveformChart       from '../components/charts/WaveformChart'
import PatientHistoryTable from '../components/PatientHistoryTable'

// Static sparkline — pre-generated once, never re-randomised
const SPARKLINE_DATA = generateSparkline(24)

export default function Dashboard({ onSocketStatus }) {
  const { heartRate, hrv, riskStatus, waveformData, history, socketStatus } = useVitalsData()

  // Bubble socketStatus up to App so SocketProvider (and Header) stays current
  useEffect(() => {
    onSocketStatus?.(socketStatus)
  }, [socketStatus, onSocketStatus])

  return (
    <div className="flex flex-col gap-5">

      {/* ── Vitals Grid ───────────────────────────────────────────────── */}
      <section
        id="vitals-grid"
        aria-label="Vital signs"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        <HeartRateCard value={heartRate} />
        <HRVCard       value={hrv} sparkline={SPARKLINE_DATA} />
        <RiskCard      status={riskStatus} />
      </section>

      {/* ── BCG Waveform ──────────────────────────────────────────────── */}
      <section id="waveform-section" aria-label="BCG waveform chart">
        <WaveformChart data={waveformData} />
      </section>

      {/* ── Patient History ───────────────────────────────────────────── */}
      <section id="history-section" aria-label="Patient history table">
        <PatientHistoryTable rows={history} />
      </section>

    </div>
  )
}
