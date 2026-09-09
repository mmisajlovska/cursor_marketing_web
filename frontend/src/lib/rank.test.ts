import { describe, expect, it } from 'vitest'
import { nextMilestone, rankClass } from '@/lib/rank'

describe('rank presentation', () => {
  it('maps podium ranks to medal classes', () => {
    expect(rankClass(1)).toBe('rank-gold')
    expect(rankClass(2)).toBe('rank-silver')
    expect(rankClass(3)).toBe('rank-bronze')
    expect(rankClass(8)).toBe('rank-rest')
  })

  it('emits score milestones every 500', () => {
    expect(nextMilestone(0)).toBeNull()
    expect(nextMilestone(499)).toBeNull()
    expect(nextMilestone(500)).toBe(500)
    expect(nextMilestone(1240)).toBe(1000)
  })
})
