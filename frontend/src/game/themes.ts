import type { ThemeId } from '@/types'

export type ThemePalette = {
  id: ThemeId
  skyTop: number
  skyBottom: number
  far: number
  near: number
  ground: number
  player: number
  obstacle: number
  collect: number
  power: number
}

export const THEMES: Record<ThemeId, ThemePalette> = {
  cyberpunk: {
    id: 'cyberpunk',
    skyTop: 0x09090b,
    skyBottom: 0x12081f,
    far: 0x1e1140,
    near: 0x16132e,
    ground: 0x09090b,
    player: 0x22d3ee,
    obstacle: 0xa855f7,
    collect: 0x22d3ee,
    power: 0x4ade80,
  },
  arcade: {
    id: 'arcade',
    skyTop: 0x09090b,
    skyBottom: 0x140814,
    far: 0x3b0764,
    near: 0x1f1028,
    ground: 0x09090b,
    player: 0xf472b6,
    obstacle: 0x22d3ee,
    collect: 0xfacc15,
    power: 0x4ade80,
  },
  clean: {
    id: 'clean',
    skyTop: 0x09090b,
    skyBottom: 0x0b1220,
    far: 0x0f2744,
    near: 0x123047,
    ground: 0x09090b,
    player: 0x38bdf8,
    obstacle: 0x818cf8,
    collect: 0x22d3ee,
    power: 0x4ade80,
  },
}
