import { create } from 'zustand'
import { personalBest } from '@/lib/score'
import type { GamePhase, PowerUpKind } from '@/types'

const GUEST_PLAYS_KEY = 'pr.guestPlays'
const BEST_KEY = 'pr.localBest'

type GameState = {
  phase: GamePhase
  runNonce: number
  score: number
  combo: number
  powerUp: PowerUpKind | null
  powerUpMs: number
  guestPlaysRemaining: number
  pendingScore: number | null
  localBest: number
  hudTick: number
  initFromTenant: (playsBeforeGate: number) => void
  startRun: () => boolean
  setHud: (patch: {
    score?: number
    combo?: number
    powerUp?: PowerUpKind | null
    powerUpMs?: number
  }) => void
  endRun: (score: number, options?: { isGuest?: boolean }) => void
  clearPending: () => void
  reset: () => void
}

function readInt(key: string, fallback: number): number {
  const raw = sessionStorage.getItem(key)
  if (raw === null) return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : fallback
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'idle',
  runNonce: 0,
  score: 0,
  combo: 0,
  powerUp: null,
  powerUpMs: 0,
  guestPlaysRemaining: 3,
  pendingScore: null,
  localBest: 0,
  hudTick: 0,
  initFromTenant: (playsBeforeGate: number) => {
    set({
      guestPlaysRemaining: readInt(GUEST_PLAYS_KEY, playsBeforeGate),
      localBest: readInt(BEST_KEY, 0),
    })
  },
  startRun: () => {
    if (get().phase === 'playing') return false
    set({
      phase: 'playing',
      runNonce: get().runNonce + 1,
      score: 0,
      combo: 0,
      powerUp: null,
      powerUpMs: 0,
      pendingScore: null,
    })
    return true
  },
  setHud: (patch) => {
    set((s) => ({
      score: patch.score ?? s.score,
      combo: patch.combo ?? s.combo,
      powerUp: patch.powerUp === undefined ? s.powerUp : patch.powerUp,
      powerUpMs: patch.powerUpMs ?? s.powerUpMs,
      hudTick: s.hudTick + 1,
    }))
  },
  endRun: (score, options) => {
    const isGuest = options?.isGuest ?? true
    const best = personalBest(get().localBest, score)
    sessionStorage.setItem(BEST_KEY, String(best))
    let guestPlaysRemaining = get().guestPlaysRemaining
    if (isGuest) {
      guestPlaysRemaining = Math.max(0, guestPlaysRemaining - 1)
      sessionStorage.setItem(GUEST_PLAYS_KEY, String(guestPlaysRemaining))
    }
    set({
      phase: 'gameover',
      score,
      localBest: best,
      pendingScore: score,
      guestPlaysRemaining,
      powerUp: null,
    })
  },
  clearPending: () => set({ pendingScore: null }),
  reset: () =>
    set({
      phase: 'idle',
      runNonce: 0,
      score: 0,
      combo: 0,
      powerUp: null,
      powerUpMs: 0,
      guestPlaysRemaining: 3,
      pendingScore: null,
      localBest: 0,
      hudTick: 0,
    }),
}))
