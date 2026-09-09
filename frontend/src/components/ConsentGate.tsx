import { useTenantStore } from '@/stores/tenantStore'

type Props = {
  consented: boolean
  onToggle: (next: boolean) => void
}

export function ConsentGate({ consented, onToggle }: Props) {
  const config = useTenantStore((s) => s.config)
  if (!config) return null

  return (
    <div className="space-y-3 text-left text-sm">
      <p className="font-medium">You&apos;re in. Here&apos;s the deal:</p>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-1"
        />
        <span>{config.consentLabelText}</span>
      </label>
      <ul className="list-disc space-y-1 pl-5 text-slate-300">
        <li>Consent = unlimited plays</li>
        <li>No consent = {config.playsBeforeGate} extra plays as a gift</li>
      </ul>
    </div>
  )
}
