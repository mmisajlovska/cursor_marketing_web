import type { PowerUpKind, ThemeId } from '@/types'

export type GameBridge = {
  theme: ThemeId
  primaryColor: string
  secondaryColor: string
  duckHeld: boolean
  onHud: (hud: {
    score: number
    combo: number
    powerUp: PowerUpKind | null
    powerUpMs: number
  }) => void
  onGameOver: (score: number) => void
  haptic?: () => void
}
