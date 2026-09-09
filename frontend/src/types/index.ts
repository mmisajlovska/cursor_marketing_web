export type ThemeId = 'cyberpunk' | 'arcade' | 'clean'

export type TenantConfig = {
  tenantId: string
  slug: string
  companyName: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  gameTitle: string
  consentLabelText: string
  characterSpriteUrl: string | null
  obstacleSpriteUrls: string[]
  backgroundSpriteUrl: string | null
  collectibleSpriteUrl: string | null
  powerUpSpriteUrl: string | null
  playsBeforeGate: number
  theme: ThemeId
  prizeCopy: string | null
  shareLinkedIn: boolean
  showPoweredBy: boolean
}

export type UserProfile = {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  freePlaysRemaining: number | null
  hasConsented: boolean
}

export type LeaderboardEntry = {
  rank: number
  userId: string
  displayName: string
  avatarUrl: string | null
  score: number
  lastPlayedAt: string
}

export type GamePhase = 'idle' | 'playing' | 'gameover'

export type PowerUpKind = 'shield'
