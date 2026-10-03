/**
 * App.jsx
 *
 * Root application shell.
 * Manages the active page state and renders Sidebar + Header + page content.
 *
 * SocketProvider is placed HERE (wrapping the whole app) so that Header.jsx
 * can read the live socketStatus from context without prop-drilling through
 * App → Header.
 *
 * To add new pages:
 *  1. Create the page in src/pages/
 *  2. Add an entry to PAGE_MAP below
 *  3. Add a nav item to src/components/layout/Sidebar.jsx
 */
import { useState, useCallback } from 'react'
import Sidebar             from './components/layout/Sidebar'
import Header              from './components/layout/Header'
import Dashboard           from './pages/Dashboard'
import { SocketProvider }  from './context/SocketContext'

// ── Page registry ─────────────────────────────────────────────────────────────
// Dashboard receives onSocketStatus so it can report its connection state up
const makePageMap = (onSocketStatus) => ({
  dashboard: <Dashboard onSocketStatus={onSocketStatus} />,
  history:   (
    <div className="flex h-64 items-center justify-center text-zinc-600 text-sm">
      Patient History page – coming soon
    </div>
  ),
  alerts:    (
    <div className="flex h-64 items-center justify-center text-zinc-600 text-sm">
      Alerts page – coming soon
    </div>
  ),
})

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [activePage,   setActivePage]   = useState('dashboard')
  const [socketStatus, setSocketStatus] = useState('connecting')

  const handleSocketStatus = useCallback((s) => setSocketStatus(s), [])

  const PAGE_MAP = makePageMap(handleSocketStatus)

  return (
    // SocketProvider wraps the ENTIRE app so Header can read socketStatus
    <SocketProvider status={socketStatus}>
      <div className="flex min-h-screen bg-zinc-950">
        {/* Fixed sidebar – 68px wide */}
        <Sidebar activePage={activePage} onNavigate={setActivePage} />

        {/* Main area – offset by sidebar width */}
        <div className="flex flex-1 flex-col ml-[68px]">
          <Header />

          <main
            id="main-content"
            className="flex-1 overflow-y-auto p-5"
            style={{
              /* Subtle radial gradient backdrop for depth */
              background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(6,182,212,0.04) 0%, transparent 70%), #09090b',
            }}
          >
            {PAGE_MAP[activePage] ?? <Dashboard onSocketStatus={handleSocketStatus} />}
          </main>
        </div>
      </div>
    </SocketProvider>
  )
}
