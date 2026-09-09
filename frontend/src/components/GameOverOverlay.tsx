import { ShareButtons } from '@/components/ShareButtons'
import { canStartRun } from '@/lib/eligibility'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import { useTenantStore } from '@/stores/tenantStore'

type Props = {
  onPlayAgain: () => void
  onSaveRank: () => void
}

export function GameOverOverlay({ onPlayAgain, onSaveRank }: Props) {
  const score = useGameStore((s) => s.score)
  const localBest = useGameStore((s) => s.localBest)
  const guestPlaysRemaining = useGameStore((s) => s.guestPlaysRemaining)
  const user = useAuthStore((s) => s.user)
  const config = useTenantStore((s) => s.config)

  const canPlay = canStartRun({
    isGuest: !user,
    guestPlaysRemaining,
    hasConsented: user?.hasConsented ?? false,
    freePlaysRemaining: user?.freePlaysRemaining ?? null,
  })

  const remainingLabel = user
    ? user.hasConsented
      ? 'Unlimited plays'
      : `${user.freePlaysRemaining ?? 0} plays left without marketing emails`
    : `${guestPlaysRemaining} guest plays left`

  return (
    <div className="absolute inset-0 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-6">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-secondary">
          Game over
        </p>
        <p className="mt-2 font-mono text-5xl font-bold tabular-nums">
          {score}
        </p>
        <p className="text-sm text-slate-300">
          Personal best: {localBest}
          {score >= localBest && score > 0 ? ' · New best!' : ''}
        </p>
        <p className="mt-2 text-sm text-slate-400">{remainingLabel}</p>
        {config?.prizeCopy ? (
          <p className="mt-2 text-sm text-slate-300">{config.prizeCopy}</p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={!canPlay}
            onClick={onPlayAgain}
            className="btn-neon disabled:opacity-40"
          >
            Play Again
          </button>
          <button type="button" onClick={onSaveRank} className="btn-violet">
            {user ? 'Update leaderboard' : 'Save your score / Claim your rank'}
          </button>
        </div>
        <div className="mt-4">
          <ShareButtons score={score} />
        </div>
      </div>
    </div>
  )
}
