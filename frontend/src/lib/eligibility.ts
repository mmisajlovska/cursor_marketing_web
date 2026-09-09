export function canStartRun(input: {
  isGuest: boolean
  guestPlaysRemaining: number
  hasConsented: boolean
  freePlaysRemaining: number | null
}): boolean {
  if (input.isGuest) return input.guestPlaysRemaining > 0
  if (input.hasConsented) return true
  return (input.freePlaysRemaining ?? 0) > 0
}
