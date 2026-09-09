import {
  linkedInShareUrl,
  shareText,
  twitterShareUrl,
  whatsappShareUrl,
} from '@/lib/share'
import { useTenantStore } from '@/stores/tenantStore'

export function ShareButtons({ score }: { score: number }) {
  const config = useTenantStore((s) => s.config)
  if (!config) return null
  const url = window.location.origin + '/play'
  const text = shareText(score, config.gameTitle, url)

  return (
    <div className="flex flex-wrap gap-2">
      <a
        className="btn-ghost px-3 py-1.5 text-xs"
        href={twitterShareUrl(text)}
        target="_blank"
        rel="noreferrer"
      >
        Share on X
      </a>
      <a
        className="btn-ghost px-3 py-1.5 text-xs"
        href={whatsappShareUrl(text)}
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp
      </a>
      {config.shareLinkedIn ? (
        <a
          className="btn-ghost px-3 py-1.5 text-xs"
          href={linkedInShareUrl(url)}
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>
      ) : null}
    </div>
  )
}
