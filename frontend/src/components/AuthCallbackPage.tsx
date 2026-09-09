import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const completeMagicLink = useAuthStore((s) => s.completeMagicLink)
  const token = params.get('token') ?? params.get('auth')
  const [error, setError] = useState<string | null>(
    token ? null : 'Missing token',
  )

  useEffect(() => {
    if (!token) return
    void completeMagicLink(token)
      .then(() => navigate('/play'))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Auth failed'),
      )
  }, [completeMagicLink, navigate, token])

  return (
    <div className="px-4 py-16 text-center">
      {error ? <p className="text-red-400">{error}</p> : <p>Signing you in…</p>}
    </div>
  )
}
