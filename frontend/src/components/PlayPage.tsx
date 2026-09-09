import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { AuthModal } from '@/components/AuthModal'
import { GameHud } from '@/components/GameHud'
import { GameOverOverlay } from '@/components/GameOverOverlay'
import { canStartRun } from '@/lib/eligibility'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import { useLeaderboardStore } from '@/stores/leaderboardStore'

const PhaserGame = lazy(async () => {
  const mod = await import('@/components/PhaserGame')
  return { default: mod.PhaserGame }
})

export function PlayPage() {
  const [duckHeld, setDuckHeld] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const phase = useGameStore((s) => s.phase)
  const startRun = useGameStore((s) => s.startRun)
  const guestPlaysRemaining = useGameStore((s) => s.guestPlaysRemaining)
  const user = useAuthStore((s) => s.user)

  const canPlay = canStartRun({
    isGuest: !user,
    guestPlaysRemaining,
    hasConsented: user?.hasConsented ?? false,
    freePlaysRemaining: user?.freePlaysRemaining ?? null,
  })

  useEffect(() => {
    if (phase === 'idle' && canPlay) startRun()
  }, [phase, canPlay, startRun])

  const showAuth = authOpen || (phase === 'idle' && !canPlay)

  const onGameOver = useCallback((score: number) => {
    const authed = useAuthStore.getState().user
    useGameStore.getState().endRun(score, { isGuest: !authed })
    if (authed && !authed.hasConsented) {
      useAuthStore.getState().decrementFreePlay()
    }
  }, [])

  function playAgain() {
    if (!canPlay) {
      setAuthOpen(true)
      return
    }
    startRun()
  }

  function saveRank() {
    if (!user) {
      setAuthOpen(true)
      return
    }
    const pending = useGameStore.getState().pendingScore
    if (pending !== null) {
      void useAuthStore.getState().bindPendingScore(pending)
      useLeaderboardStore.getState().upsertScore({
        userId: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        score: pending,
      })
      useGameStore.getState().clearPending()
    }
  }

  return (
    <div className="px-3 pb-8">
      <p className="mb-3 text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">
        Tap / Space to jump · Hold Duck to slide
      </p>
      <div className="relative mx-auto max-w-5xl">
        {phase === 'playing' ? (
          <Suspense
            fallback={
              <div className="game-frame mx-auto aspect-video w-full max-w-5xl bg-black/60" />
            }
          >
            <PhaserGame duckHeld={duckHeld} onGameOver={onGameOver} />
          </Suspense>
        ) : (
          <div className="game-frame mx-auto aspect-video w-full max-w-5xl bg-black/60" />
        )}
        {phase === 'playing' ? <GameHud /> : null}
        {phase === 'gameover' ? (
          <GameOverOverlay onPlayAgain={playAgain} onSaveRank={saveRank} />
        ) : null}
        {showAuth ? (
          <AuthModal
            onClose={() => setAuthOpen(false)}
            onComplete={() => setAuthOpen(false)}
          />
        ) : null}
      </div>
      <div className="mx-auto mt-3 flex max-w-5xl justify-center md:hidden">
        <button
          type="button"
          className="glass min-h-12 w-full max-w-sm px-6 py-3 font-display text-sm tracking-widest"
          onPointerDown={() => setDuckHeld(true)}
          onPointerUp={() => setDuckHeld(false)}
          onPointerCancel={() => setDuckHeld(false)}
        >
          DUCK
        </button>
      </div>
    </div>
  )
}
