import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { LandingPage } from '@/components/LandingPage'
import { MOCK_TENANT } from '@/mocks/tenantConfig'
import { useTenantStore } from '@/stores/tenantStore'

describe('LandingPage', () => {
  beforeEach(() => {
    useTenantStore.setState({
      status: 'ready',
      config: MOCK_TENANT,
      error: null,
    })
  })

  it('lets guests play without auth', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Play Now' })).toBeInTheDocument()
    expect(screen.getByText(/guest/i)).toBeInTheDocument()
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument()
  })
})
