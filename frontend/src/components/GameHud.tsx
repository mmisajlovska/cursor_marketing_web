import { useEffect, useRef, useState } from 'react'
import { nextMilestone } from '@/lib/rank'
import { useGameStore } from '@/stores/gameStore'

export function GameHud() {
  const score = useGameStore((s) => s.score)
  const combo = useGameStore((s) => s.combo)
  const powerUp = useGameStore((s) => s.powerUp)
  const powerUpMs = useGameStore((s) => s.powerUpMs)
  const [toast, setToast] = useState<number | null>(null)
  const seen = useRef(0)

  useEffect(() => {
    const mark = nextMilestone(score)
    if (mark && mark !== seen.current) {
      seen.current = mark
      setToast(mark)
      const id = window.setTimeout(() => setToast(null), 700)
      return () => window.clearTimeout(id)
    }
  }, [score])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-3">
      <div className="glass px-3 py-1.5 font-mono text-sm font-semibold tabular-nums sm:text-base">
        {score}
      </div>
      <div className="flex items-start gap-2">
        {combo > 1 ? (
          <div className="rounded-xl border border-secondary/40 bg-secondary/20 px-3 py-1.5 font-display text-xs font-bold text-secondary backdrop-blur-md">
            x{combo} combo
          </div>
        ) : null}
        {powerUp === 'shield' ? (
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/20 px-3 py-1.5 font-display text-xs font-bold text-emerald-300 backdrop-blur-md">
            Shield {Math.ceil(powerUpMs / 1000)}s
          </div>
        ) : null}
      </div>
      {toast ? (
        <div className="milestone pointer-events-none absolute inset-x-0 top-14 text-center font-display text-2xl font-extrabold text-secondary">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
