import { describe, expect, it } from 'vitest'
import {
  comboBonus,
  distanceScore,
  nextSpawnDelay,
  personalBest,
  rollSpawnKind,
  runSpeed,
} from '@/lib/score'

describe('score helpers', () => {
  it('awards combo bonus linearly', () => {
    expect(comboBonus(0)).toBe(0)
    expect(comboBonus(3)).toBe(150)
  })

  it('counts distance every 100ms', () => {
    expect(distanceScore(0)).toBe(0)
    expect(distanceScore(250)).toBe(2)
  })

  it('tightens spawn delay over time', () => {
    expect(nextSpawnDelay(0)).toBeGreaterThan(nextSpawnDelay(60_000))
  })

  it('speeds up the run over time', () => {
    expect(runSpeed(60_000)).toBeGreaterThan(runSpeed(0))
  })

  it('keeps personal best', () => {
    expect(personalBest(10, 4)).toBe(10)
    expect(personalBest(10, 12)).toBe(12)
  })

  it('rolls spawn kinds from rng', () => {
    expect(rollSpawnKind(() => 0.01)).toBe('powerup')
    expect(rollSpawnKind(() => 0.2)).toBe('collect')
    expect(rollSpawnKind(() => 0.5)).toBe('low')
    expect(rollSpawnKind(() => 0.9)).toBe('high')
  })
})
