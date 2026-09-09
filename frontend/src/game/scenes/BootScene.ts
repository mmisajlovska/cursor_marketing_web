import Phaser from 'phaser'
import type { GameBridge } from '@/game/bridge'
import { THEMES } from '@/game/themes'
import { generateWorldTextures, hexColor } from '@/game/textures'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  create(): void {
    const bridge = this.registry.get('bridge') as GameBridge
    const theme = THEMES[bridge.theme]
    generateWorldTextures(
      this,
      theme,
      hexColor(bridge.primaryColor, theme.player),
      hexColor(bridge.secondaryColor, theme.obstacle),
    )
    this.scene.start('GameScene')
  }
}
