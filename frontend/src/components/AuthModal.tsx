import { useState } from 'react'
import { ConsentGate } from '@/components/ConsentGate'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import { useLeaderboardStore } from '@/stores/leaderboardStore'

type Step = 'method' | 'magic' | 'nickname' | 'consent'

type Props = {
  onClose: () => void
  onComplete: () => void
}

export function AuthModal({ onClose, onComplete }: Props) {
  const [step, setStep] = useState<Step>('method')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('Player')
  const [nick, setNick] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loginGoogle = useAuthStore((s) => s.loginGoogle)
  const sendMagicLink = useAuthStore((s) => s.sendMagicLink)
  const completeMagicLink = useAuthStore((s) => s.completeMagicLink)
  const setDisplayName = useAuthStore((s) => s.setDisplayName)
  const setConsentStore = useAuthStore((s) => s.setConsent)
  const bindPendingScore = useAuthStore((s) => s.bindPendingScore)

  async function finishBoard(): Promise<void> {
    const user = useAuthStore.getState().user
    const pending = useGameStore.getState().pendingScore
    if (user && pending !== null) {
      await bindPendingScore(pending)
      useLeaderboardStore.getState().upsertScore({
        userId: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        score: pending,
      })
      useGameStore.getState().clearPending()
    }
    onComplete()
  }

  async function afterAuth(): Promise<void> {
    const user = useAuthStore.getState().user
    setNick(user?.displayName ?? '')
    setStep('nickname')
  }

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-6">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="font-display text-lg tracking-wide">
            Claim your rank
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400">
            Close
          </button>
        </div>

        {step === 'method' ? (
          <div className="space-y-3">
            <button
              type="button"
              className="w-full rounded-full bg-white py-2.5 font-semibold text-black"
              onClick={() => {
                void loginGoogle(name)
                  .then(() => afterAuth())
                  .catch((e: unknown) =>
                    setError(
                      e instanceof Error ? e.message : 'Google sign-in failed',
                    ),
                  )
              }}
            >
              Continue with Google
            </button>
            <p className="text-center text-xs text-slate-500">
              Mock Google login for local/dev until OAuth client is wired.
            </p>
            <label className="block text-sm">
              Display name for mock Google
              <input
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div className="border-t border-white/10 pt-3">
              <label className="block text-sm">
                Or magic link email
                <input
                  type="email"
                  className="field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn-ghost mt-2 w-full"
                onClick={() => {
                  if (!email.includes('@')) {
                    setError('Enter a valid email')
                    return
                  }
                  void sendMagicLink(email)
                    .then(() => setStep('magic'))
                    .catch((e: unknown) =>
                      setError(
                        e instanceof Error ? e.message : 'Could not send link',
                      ),
                    )
                }}
              >
                Email me a link
              </button>
            </div>
          </div>
        ) : null}

        {step === 'magic' ? (
          <div className="space-y-3">
            <p>
              Check your inbox. For local/dev, continue with the mock token.
            </p>
            <button
              type="button"
              className="btn-violet w-full"
              onClick={() => {
                void completeMagicLink('dev')
                  .then(() => afterAuth())
                  .catch((e: unknown) =>
                    setError(e instanceof Error ? e.message : 'Verify failed'),
                  )
              }}
            >
              Continue (mock verify)
            </button>
          </div>
        ) : null}

        {step === 'nickname' ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              setDisplayName(nick)
              setStep('consent')
            }}
          >
            <label className="block text-sm">
              Leaderboard name (never shows your email)
              <input
                className="field"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="btn-neon w-full">
              Continue
            </button>
          </form>
        ) : null}

        {step === 'consent' ? (
          <div className="space-y-4">
            <ConsentGate consented={consent} onToggle={setConsent} />
            <button
              type="button"
              className="btn-neon w-full"
              onClick={() => {
                void setConsentStore(consent)
                  .then(() => finishBoard())
                  .catch((e: unknown) =>
                    setError(e instanceof Error ? e.message : 'Consent failed'),
                  )
              }}
            >
              {consent ? 'Play unlimited' : 'Play with remaining tries'}
            </button>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </div>
    </div>
  )
}
