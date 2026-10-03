/**
 * components/layout/Sidebar.jsx
 *
 * Fixed, icon-only navigation sidebar.
 * Highlights the active route via the `activePage` prop.
 *
 * Props:
 *  activePage  (string) – currently active page key
 *  onNavigate  (fn)     – called with page key when nav item is clicked
 */
import { Activity, ClipboardList, Bell, Settings } from 'lucide-react'
import { cn } from '../../lib/utils'

// ── Patient avatar initials ─────────────────────────────────────────────────
const INITIALS = 'AJ'

// ── Navigation items ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Live Dashboard',   Icon: Activity },
  { key: 'history',   label: 'Patient History',  Icon: ClipboardList },
  { key: 'alerts',    label: 'Alerts',            Icon: Bell },
]

// ── NavButton ────────────────────────────────────────────────────────────────
function NavButton({ itemKey, label, Icon, isActive, onClick }) {
  return (
    <button
      id={`sidebar-nav-${itemKey}`}
      onClick={() => onClick(itemKey)}
      title={label}
      aria-label={label}
      className={cn(
        'group relative flex items-center justify-center w-11 h-11 rounded-xl',
        'transition-all duration-200 ease-in-out',
        isActive
          ? 'bg-cyan-500/15 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.35)]'
          : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200',
      )}
    >
      <Icon size={20} strokeWidth={isActive ? 2 : 1.75} />

      {/* Tooltip */}
      <span
        className="pointer-events-none absolute left-14 whitespace-nowrap rounded-lg
                   bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100
                   opacity-0 translate-x-[-4px] shadow-xl ring-1 ring-zinc-700/50
                   transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0
                   z-50"
      >
        {label}
      </span>

      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute right-[-13px] top-1/2 -translate-y-1/2 h-5 w-[3px]
                         bg-cyan-400 rounded-full" />
      )}
    </button>
  )
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside
      id="sidebar"
      className="fixed left-0 top-0 z-40 flex h-full w-[68px] flex-col
                 items-center gap-2 py-5
                 bg-zinc-950 border-r border-zinc-800/60"
    >
      {/* Avatar */}
      <div
        id="sidebar-avatar"
        className="flex items-center justify-center w-10 h-10 rounded-xl
                   bg-gradient-to-br from-cyan-500 to-blue-600
                   text-white text-sm font-bold tracking-wide
                   ring-2 ring-cyan-500/30 mb-4 flex-shrink-0"
      >
        {INITIALS}
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col items-center gap-2">
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <NavButton
            key={key}
            itemKey={key}
            label={label}
            Icon={Icon}
            isActive={activePage === key}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* Settings – bottom pinned */}
      <button
        id="sidebar-nav-settings"
        title="Settings"
        aria-label="Settings"
        className="flex items-center justify-center w-11 h-11 rounded-xl
                   text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300
                   transition-all duration-200 ease-in-out"
      >
        <Settings size={20} strokeWidth={1.75} />
      </button>
    </aside>
  )
}
