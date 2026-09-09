import { create } from 'zustand'
import {
  bindGuestScore,
  loginWithGoogleMock,
  requestMagicLink,
  submitConsent,
  verifyMagicLink,
} from '@/api/client'
import type { UserProfile } from '@/types'

const ACCESS_KEY = 'pr.accessToken'
const REFRESH_KEY = 'pr.refreshToken'
const USER_KEY = 'pr.user'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: UserProfile | null
  magicEmailSent: boolean
  nicknameNeeded: boolean
  loadFromSession: () => void
  loginGoogle: (name: string) => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  completeMagicLink: (token: string) => Promise<void>
  setDisplayName: (name: string) => void
  setConsent: (consented: boolean) => Promise<void>
  bindPendingScore: (score: number) => Promise<void>
  decrementFreePlay: () => void
  logout: () => void
  reset: () => void
}

function persist(token: string, refresh: string, user: UserProfile): void {
  sessionStorage.setItem(ACCESS_KEY, token)
  sessionStorage.setItem(REFRESH_KEY, refresh)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSession(): void {
  sessionStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(REFRESH_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  magicEmailSent: false,
  nicknameNeeded: false,
  loadFromSession: () => {
    const accessToken = sessionStorage.getItem(ACCESS_KEY)
    const refreshToken = sessionStorage.getItem(REFRESH_KEY)
    const raw = sessionStorage.getItem(USER_KEY)
    if (!accessToken || !raw) return
    try {
      const user = JSON.parse(raw) as UserProfile
      set({ accessToken, refreshToken, user })
    } catch {
      clearSession()
    }
  },
  loginGoogle: async (name: string) => {
    const result = await loginWithGoogleMock(name)
    persist(result.accessToken, result.refreshToken, result.user)
    set({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      nicknameNeeded: !result.user.displayName.trim(),
    })
  },
  sendMagicLink: async (email: string) => {
    await requestMagicLink(email)
    set({ magicEmailSent: true })
  },
  completeMagicLink: async (token: string) => {
    const result = await verifyMagicLink(token)
    persist(result.accessToken, result.refreshToken, result.user)
    set({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      magicEmailSent: false,
      nicknameNeeded: !result.user.displayName.trim(),
    })
  },
  setDisplayName: (name: string) => {
    const user = get().user
    if (!user) return
    const next = { ...user, displayName: name.trim() || user.displayName }
    sessionStorage.setItem(USER_KEY, JSON.stringify(next))
    set({ user: next, nicknameNeeded: false })
  },
  setConsent: async (consented: boolean) => {
    const user = get().user
    if (!user) return
    await submitConsent(consented)
    const next: UserProfile = {
      ...user,
      hasConsented: consented,
      freePlaysRemaining: consented ? null : user.freePlaysRemaining,
    }
    sessionStorage.setItem(USER_KEY, JSON.stringify(next))
    set({ user: next })
  },
  bindPendingScore: async (score: number) => {
    await bindGuestScore(score)
  },
  decrementFreePlay: () => {
    const user = get().user
    if (!user || user.hasConsented || user.freePlaysRemaining === null) return
    const next = {
      ...user,
      freePlaysRemaining: Math.max(0, user.freePlaysRemaining - 1),
    }
    sessionStorage.setItem(USER_KEY, JSON.stringify(next))
    set({ user: next })
  },
  logout: () => {
    clearSession()
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      magicEmailSent: false,
      nicknameNeeded: false,
    })
  },
  reset: () => {
    clearSession()
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      magicEmailSent: false,
      nicknameNeeded: false,
    })
  },
}))
