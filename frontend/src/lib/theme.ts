import type { TenantConfig } from '@/types'

export function applyTenantTheme(config: TenantConfig): void {
  const root = document.documentElement
  root.style.setProperty('--color-primary', config.primaryColor)
  root.style.setProperty('--color-secondary', config.secondaryColor)
  root.style.setProperty('--color-bg', '#09090b')
  root.style.setProperty('--color-tenant-wash', config.backgroundColor)
  document.title = config.gameTitle
  const themeMeta = document.querySelector('meta[name="theme-color"]')
  if (themeMeta) themeMeta.setAttribute('content', '#09090b')
}
