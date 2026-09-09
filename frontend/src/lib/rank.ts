export function rankClass(rank: number): string {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return 'rank-rest'
}

export function nextMilestone(score: number, step = 500): number | null {
  if (score < step) return null
  return Math.floor(score / step) * step
}
