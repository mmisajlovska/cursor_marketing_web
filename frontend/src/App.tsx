import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { AuthCallbackPage } from '@/components/AuthCallbackPage'
import { LandingPage } from '@/components/LandingPage'
import { LeaderboardPage } from '@/components/LeaderboardPage'
import { PlayPage } from '@/components/PlayPage'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import { useLeaderboardStore } from '@/stores/leaderboardStore'
import { useTenantStore } from '@/stores/tenantStore'

export default function App() {
  const tenantStatus = useTenantStore((s) => s.status)
  const tenantError = useTenantStore((s) => s.error)
  const loadTenant = useTenantStore((s) => s.load)
  const config = useTenantStore((s) => s.config)
  const loadAuth = useAuthStore((s) => s.loadFromSession)
  const initGame = useGameStore((s) => s.initFromTenant)
  const loadBoard = useLeaderboardStore((s) => s.load)

  useEffect(() => {
    loadAuth()
    void loadTenant()
    void loadBoard()
  }, [loadAuth, loadTenant, loadBoard])

  useEffect(() => {
    if (config) initGame(config.playsBeforeGate)
  }, [config, initGame])

  if (tenantStatus === 'error') {
    return (
      <div className="grid min-h-svh place-items-center p-6 text-red-300">
        {tenantError}
      </div>
    )
  }

  if (tenantStatus !== 'ready' || !config) {
    return (
      <div className="grid min-h-svh place-items-center bg-[#09090b] font-display tracking-[0.3em] text-secondary">
        LOADING
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
