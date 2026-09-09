import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { isMuted, setMuted } from '@/lib/sfx'
import { useTenantStore } from '@/stores/tenantStore'

export function AppShell({ children }: { children: ReactNode }) {
  const config = useTenantStore((s) => s.config)
  const [mute, setMute] = useState(() => isMuted())

  return (
    <div className="min-h-svh text-slate-100">
      <div className="atmosphere" aria-hidden>
        <div className="atmosphere-grid" />
        <div className="atmosphere-dust" />
      </div>
      <div className="shell flex min-h-svh flex-col">
        <header className="glass mx-3 mt-3 flex items-center justify-between gap-3 px-3 py-2 sm:mx-4 sm:px-4">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 font-display text-sm tracking-wide"
          >
            {config?.logoUrl ? (
              <img src={config.logoUrl} alt="" className="h-8 w-8 rounded-lg" />
            ) : (
              <span
                className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-bold text-white shadow-violet"
                aria-hidden
              >
                {config?.companyName.slice(0, 1) ?? 'P'}
              </span>
            )}
            <span className="truncate">
              {config?.gameTitle ?? 'PromoRunner'}
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
            <Link
              className="rounded-full px-2 py-1 hover:text-secondary"
              to="/leaderboard"
            >
              Board
            </Link>
            <button
              type="button"
              className="btn-ghost px-3 py-1.5 text-[11px] sm:text-xs"
              onClick={() => {
                const next = !mute
                setMuted(next)
                setMute(next)
              }}
            >
              {mute ? 'Sound off' : 'Sound on'}
            </button>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        {config?.showPoweredBy ? (
          <p className="py-5 text-center text-[10px] uppercase tracking-[0.25em] text-slate-500">
            Powered by PromoRunner
          </p>
        ) : null}
      </div>
    </div>
  )
}
