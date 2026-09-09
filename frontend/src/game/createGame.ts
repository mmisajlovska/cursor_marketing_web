import Phaser from 'phaser'
import type { GameBridge } from '@/game/bridge'
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/constants'
import { BootScene } from '@/game/scenes/BootScene'
import { GameScene } from '@/game/scenes/GameScene'

export type { GameBridge } from '@/game/bridge'

export function createPromoGame(
  parent: HTMLElement,
  bridge: GameBridge,
): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#09090b',
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 1800 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    audio: { noAudio: true },
    callbacks: {
      preBoot: (g) => {
        g.registry.set('bridge', bridge)
      },
    },
    scene: [BootScene, GameScene],
  })
  game.registry.set('bridge', bridge)
  return game
}
