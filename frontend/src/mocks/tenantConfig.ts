import type { TenantConfig } from '@/types'

export const MOCK_TENANT: TenantConfig = {
  tenantId: '11111111-1111-4111-8111-111111111111',
  slug: 'acme',
  companyName: 'Acme Corp',
  logoUrl: null,
  primaryColor: '#8b5cf6',
  secondaryColor: '#22d3ee',
  backgroundColor: '#09090b',
  gameTitle: 'Acme Dash',
  consentLabelText:
    'I agree to receive marketing emails from Acme Corp. You can unsubscribe any time.',
  characterSpriteUrl: null,
  obstacleSpriteUrls: [],
  backgroundSpriteUrl: null,
  collectibleSpriteUrl: null,
  powerUpSpriteUrl: null,
  playsBeforeGate: 3,
  theme: 'cyberpunk',
  prizeCopy: 'Top scores may win a swag pack.',
  shareLinkedIn: true,
  showPoweredBy: true,
}
