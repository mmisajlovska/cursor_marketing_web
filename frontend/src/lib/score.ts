export function comboBonus(combo: number): number {
  if (combo <= 0) return 0
  return 50 * combo
}

export function distanceScore(elapsedMs: number): number {
  return Math.floor(Math.max(0, elapsedMs) / 100)
}

export function nextSpawnDelay(elapsedMs: number): number {
  const t = Math.min(elapsedMs / 60_000, 1)
  return Math.round(1400 - t * 700)
}

export function runSpeed(elapsedMs: number): number {
  const t = Math.min(elapsedMs / 60_000, 1)
  return 280 + t * 220
}

export type SpawnKind = 'low' | 'high' | 'collect' | 'powerup'

export function rollSpawnKind(rng: () => number = Math.random): SpawnKind {
  const r = rng()
  if (r < 0.07) return 'powerup'
  if (r < 0.36) return 'collect'
  if (r < 0.68) return 'low'
  return 'high'
}

export function personalBest(currentBest: number, score: number): number {
  return Math.max(currentBest, score)
}
