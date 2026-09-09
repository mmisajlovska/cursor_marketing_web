import { create } from 'zustand'
import { fetchTenantConfig } from '@/api/client'
import { extractTenantSlug } from '@/lib/slug'
import { applyTenantTheme } from '@/lib/theme'
import type { TenantConfig } from '@/types'

type TenantState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  config: TenantConfig | null
  error: string | null
  load: () => Promise<void>
}

export const useTenantStore = create<TenantState>((set, get) => ({
  status: 'idle',
  config: null,
  error: null,
  load: async () => {
    if (get().status === 'loading' || get().status === 'ready') return
    set({ status: 'loading', error: null })
    try {
      const slug = extractTenantSlug(window.location.hostname)
      const config = await fetchTenantConfig(slug)
      applyTenantTheme(config)
      set({ config, status: 'ready' })
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load brand',
      })
    }
  },
}))
