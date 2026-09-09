import { Link, useNavigate } from 'react-router-dom'
import { LeaderboardPanel } from '@/components/LeaderboardPanel'
import { canStartRun } from '@/lib/eligibility'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import { useLeaderboardStore } from '@/stores/leaderboardStore'
import { useTenantStore } from '@/stores/tenantStore'

export function LandingPage() {
  const navigate = useNavigate()
  const config = useTenantStore((s) => s.config)
  const user = useAuthStore((s) => s.user)
  const guestPlaysRemaining = useGameStore((s) => s.guestPlaysRemaining)
  const startRun = useGameStore((s) => s.startRun)
  const entries = useLeaderboardStore((s) => s.entries).slice(0, 3)

  if (!config) return null

  const canPlay = canStartRun({
    isGuest: !user,
    guestPlaysRemaining,
    hasConsented: user?.hasConsented ?? false,
    freePlaysRemaining: user?.freePlaysRemaining ?? null,
  })

  function play() {
    if (canPlay) startRun()
    void navigate('/play')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <section className="glass relative overflow-hidden p-6 sm:p-12">
        <div className="hero-scan pointer-events-none absolute inset-0 opacity-40" />
        <p className="relative font-display text-[11px] uppercase tracking-[0.35em] text-secondary">
          {config.companyName}
        </p>
        <h1 className="relative mt-3 max-w-xl font-display text-4xl font-extrabold leading-tight sm:text-6xl">
          {config.gameTitle}
        </h1>
        <p className="relative mt-4 max-w-lg text-sm text-slate-300 sm:text-base">
          Jump, duck, grab the neon. Beat the board.
          {config.prizeCopy ? ` ${config.prizeCopy}` : ''}
        </p>
        <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={play} className="btn-neon">
            Play Now
          </button>
          <Link to="/leaderboard" className="btn-ghost text-center">
            View leaderboard
          </Link>
        </div>
        {!user ? (
          <p className="relative mt-4 text-sm text-slate-400">
            {guestPlaysRemaining} guest{' '}
            {guestPlaysRemaining === 1 ? 'play' : 'plays'} left — no account
            needed to start.
          </p>
        ) : null}
      </section>
      <section className="mt-8">
        <h2 className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-slate-400">
          Live top 3
        </h2>
        <LeaderboardPanel entries={entries} compact />
      </section>
    </div>
  )
}
