import axios from 'axios'
import { MOCK_TENANT } from '@/mocks/tenantConfig'
import { MOCK_LEADERBOARD } from '@/mocks/leaderboard'
import type { LeaderboardEntry, TenantConfig, UserProfile } from '@/types'

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10_000,
})

api.interceptors.request.use((config) => {
  const raw = sessionStorage.getItem('pr.accessToken')
  if (raw) {
    config.headers.Authorization = `Bearer ${raw}`
  }
  return config
})

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export async function fetchTenantConfig(slug: string): Promise<TenantConfig> {
  if (useMock) {
    return { ...MOCK_TENANT, slug }
  }
  const { data } = await api.get<TenantConfig>(`/tenant/config/${slug}`)
  return data
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  if (useMock) {
    const extra = sessionStorage.getItem('pr.leaderboard')
    if (extra) {
      try {
        return JSON.parse(extra) as LeaderboardEntry[]
      } catch {
        return MOCK_LEADERBOARD
      }
    }
    return MOCK_LEADERBOARD
  }
  const { data } = await api.get<{ entries: LeaderboardEntry[] }>(
    '/leaderboard',
  )
  return data.entries
}

export function persistLeaderboard(entries: LeaderboardEntry[]): void {
  sessionStorage.setItem('pr.leaderboard', JSON.stringify(entries))
}

export type AuthResult = {
  accessToken: string
  refreshToken: string
  user: UserProfile
}

export async function loginWithGoogleMock(
  displayName: string,
): Promise<AuthResult> {
  if (useMock) {
    return {
      accessToken: 'mock-access',
      refreshToken: 'mock-refresh',
      user: {
        id: crypto.randomUUID(),
        displayName,
        email: `${displayName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        avatarUrl: null,
        freePlaysRemaining: 3,
        hasConsented: false,
      },
    }
  }
  const { data } = await api.post<AuthResult>('/auth/google', {
    idToken: 'pending',
    tenantSlug: MOCK_TENANT.slug,
  })
  return data
}

export async function requestMagicLink(email: string): Promise<void> {
  if (useMock) {
    sessionStorage.setItem('pr.magicEmail', email)
    return
  }
  await api.post('/auth/magic-link/request', {
    email,
    tenantSlug: MOCK_TENANT.slug,
  })
}

export async function verifyMagicLink(token: string): Promise<AuthResult> {
  if (useMock) {
    const email =
      sessionStorage.getItem('pr.magicEmail') ?? 'player@example.com'
    const local = email.split('@')[0] ?? 'Player'
    return {
      accessToken: token || 'mock-magic',
      refreshToken: 'mock-refresh',
      user: {
        id: crypto.randomUUID(),
        displayName: local,
        email,
        avatarUrl: null,
        freePlaysRemaining: 3,
        hasConsented: false,
      },
    }
  }
  const { data } = await api.get<AuthResult>('/auth/magic-link/verify', {
    params: { token },
  })
  return data
}

export async function submitConsent(consented: boolean): Promise<void> {
  if (useMock) return
  await api.post('/consent', { consented, consentVersion: '1.0' })
}

export async function bindGuestScore(_score: number): Promise<void> {
  if (useMock) return
  await api.post('/game/guest-score/bind', { score: _score })
}
