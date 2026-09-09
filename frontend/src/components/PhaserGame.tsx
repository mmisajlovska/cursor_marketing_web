import { useEffect, useRef } from 'react'
import type { GameBridge } from '@/game/bridge'
import { createPromoGame } from '@/game/createGame'
import { useGameStore } from '@/stores/gameStore'
import { useTenantStore } from '@/stores/tenantStore'

type Props = {
  duckHeld: boolean
  onGameOver: (score: number) => void
}

export function PhaserGame({ duckHeld, onGameOver }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<ReturnType<typeof createPromoGame> | null>(null)
  const bridgeRef = useRef<GameBridge | null>(null)
  const runNonce = useGameStore((s) => s.runNonce)
  const phase = useGameStore((s) => s.phase)
  const config = useTenantStore((s) => s.config)

  useEffect(() => {
    if (bridgeRef.current) bridgeRef.current.duckHeld = duckHeld
  }, [duckHeld])

  useEffect(() => {
    if (!hostRef.current || !config || phase !== 'playing') return
    const host = hostRef.current
    host.replaceChildren()

    const bridge: GameBridge = {
      theme: config.theme,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      duckHeld: false,
      onHud: (hud) => useGameStore.getState().setHud(hud),
      onGameOver,
      haptic: () => {
        navigator.vibrate?.(12)
      },
    }
    bridgeRef.current = bridge
    const game = createPromoGame(host, bridge)
    gameRef.current = game
    return () => {
      game.destroy(true)
      gameRef.current = null
      bridgeRef.current = null
    }
  }, [runNonce, phase, config, onGameOver])

  return (
    <div
      ref={hostRef}
      className="game-frame mx-auto aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black"
    />
  )
}
