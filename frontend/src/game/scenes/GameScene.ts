import Phaser from 'phaser'
import type { GameBridge } from '@/game/bridge'
import {
  COMBO_WINDOW_MS,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_TOP,
  PLAYER_X,
  SHIELD_MS,
} from '@/game/constants'
import { THEMES } from '@/game/themes'
import { hexColor } from '@/game/textures'
import {
  comboBonus,
  distanceScore,
  nextSpawnDelay,
  rollSpawnKind,
  runSpeed,
} from '@/lib/score'
import { sfx } from '@/lib/sfx'

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private obstacles!: Phaser.Physics.Arcade.Group
  private collectibles!: Phaser.Physics.Arcade.Group
  private powerups!: Phaser.Physics.Arcade.Group
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private duckKey!: Phaser.Input.Keyboard.Key
  private jumpKey!: Phaser.Input.Keyboard.Key
  private ducking = false
  private ended = false
  private startedAt = 0
  private nextSpawnAt = 0
  private combo = 0
  private comboUntil = 0
  private bonusScore = 0
  private shieldUntil = 0
  private pointerStartY: number | null = null
  private stars!: Phaser.GameObjects.TileSprite
  private mountains!: Phaser.GameObjects.TileSprite
  private city!: Phaser.GameObjects.TileSprite
  private grid!: Phaser.GameObjects.TileSprite
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter

  constructor() {
    super('GameScene')
  }

  create(): void {
    const bridge = this.bridge()
    const theme = THEMES[bridge.theme]
    const neon = hexColor(bridge.primaryColor, theme.player)

    this.ended = false
    this.startedAt = this.time.now
    this.nextSpawnAt = this.time.now + 700
    this.combo = 0
    this.bonusScore = 0
    this.shieldUntil = 0
    this.ducking = false

    this.cameras.main.setBackgroundColor(theme.skyTop)
    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, theme.skyBottom, 1)
      .setOrigin(0)
      .setDepth(-8)

    this.stars = this.add
      .tileSprite(0, 0, GAME_WIDTH, 280, 'dust')
      .setOrigin(0)
      .setAlpha(0.35)
      .setDepth(-7)
    this.mountains = this.add
      .tileSprite(0, 140, GAME_WIDTH, 220, 'mountains')
      .setOrigin(0)
      .setAlpha(0.85)
      .setDepth(-6)
    this.city = this.add
      .tileSprite(0, 220, GAME_WIDTH, 260, 'city')
      .setOrigin(0)
      .setDepth(-5)
    this.grid = this.add
      .tileSprite(0, GROUND_TOP - 8, GAME_WIDTH, 120, 'grid-floor')
      .setOrigin(0)
      .setDepth(-4)

    this.dust = this.add.particles(0, 0, 'dust', {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 40, max: GROUND_TOP - 40 },
      lifespan: 4000,
      speedX: { min: -12, max: -4 },
      speedY: { min: -6, max: 6 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.35, end: 0 },
      quantity: 1,
      frequency: 90,
      blendMode: 'ADD',
    })
    this.dust.setDepth(-3)

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT)
    const ground = this.physics.add.staticImage(
      GAME_WIDTH / 2,
      GROUND_TOP + 20,
      'ground',
    )
    ground.setAlpha(0.001)
    ground.refreshBody()

    this.player = this.physics.add.sprite(PLAYER_X, GROUND_TOP - 24, 'player')
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(2)
    this.standHitbox()
    this.addGlow(this.player, neon, 6)

    if (this.isWebGL()) {
      this.cameras.main.postFX.addVignette(0.5, 0.55, 0.7, 0.35)
    }

    this.obstacles = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    })
    this.collectibles = this.physics.add.group({ allowGravity: false })
    this.powerups = this.physics.add.group({ allowGravity: false })

    this.physics.add.collider(this.player, ground)
    this.physics.add.overlap(
      this.player,
      this.obstacles,
      this.onHitObstacle,
      undefined,
      this,
    )
    this.physics.add.overlap(
      this.player,
      this.collectibles,
      this.onCollect,
      undefined,
      this,
    )
    this.physics.add.overlap(
      this.player,
      this.powerups,
      this.onPower,
      undefined,
      this,
    )

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.duckKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.pointerStartY = p.y
      if (p.y < GAME_HEIGHT * 0.72) this.tryJump()
    })
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.pointerStartY !== null && p.y - this.pointerStartY > 36) {
        this.setDuck(true)
        this.time.delayedCall(280, () => this.setDuck(false))
      }
      this.pointerStartY = null
    })
  }

  update(): void {
    if (this.ended) return
    const elapsed = this.time.now - this.startedAt
    const speed = runSpeed(elapsed)
    this.stars.tilePositionX += speed * 0.0015
    this.mountains.tilePositionX += speed * 0.004
    this.city.tilePositionX += speed * 0.012
    this.grid.tilePositionX += speed * 0.028

    const wantDuck =
      this.cursors.down.isDown || this.duckKey.isDown || this.bridge().duckHeld
    this.setDuck(wantDuck)

    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.jumpKey)
    ) {
      this.tryJump()
    }

    if (this.time.now > this.nextSpawnAt) {
      this.spawn()
      this.nextSpawnAt = this.time.now + nextSpawnDelay(elapsed)
    }

    this.recycle(this.obstacles, speed)
    this.recycle(this.collectibles, speed)
    this.recycle(this.powerups, speed)

    if (this.time.now > this.comboUntil) this.combo = 0

    const score = distanceScore(elapsed) + this.bonusScore
    const shieldLeft = Math.max(0, this.shieldUntil - this.time.now)
    this.bridge().onHud({
      score,
      combo: this.combo,
      powerUp: shieldLeft > 0 ? 'shield' : null,
      powerUpMs: shieldLeft,
    })
  }

  private bridge(): GameBridge {
    return this.registry.get('bridge') as GameBridge
  }

  private isWebGL(): boolean {
    return this.game.renderer.type === Phaser.WEBGL
  }

  private addGlow(
    sprite: Phaser.GameObjects.Sprite,
    color: number,
    strength: number,
  ): void {
    if (!this.isWebGL()) return
    sprite.postFX.addGlow(color, strength, 0, false, 0.2, 16)
  }

  private arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.player.body as Phaser.Physics.Arcade.Body
  }

  private standHitbox(): void {
    this.player.setDisplaySize(32, 48)
    this.arcadeBody().setSize(28, 46)
    this.arcadeBody().setOffset(2, 1)
  }

  private duckHitbox(): void {
    this.arcadeBody().setSize(28, 22)
    this.arcadeBody().setOffset(2, 24)
  }

  private setDuck(on: boolean): void {
    if (on === this.ducking) return
    const body = this.arcadeBody()
    if (on && !body.touching.down && !body.blocked.down) return
    this.ducking = on
    this.tweens.killTweensOf(this.player)
    if (on) {
      this.duckHitbox()
      this.tweens.add({
        targets: this.player,
        scaleY: 0.52,
        scaleX: 1.08,
        duration: 90,
        ease: 'Cubic.easeOut',
      })
      sfx.duck()
    } else {
      this.standHitbox()
      this.tweens.add({
        targets: this.player,
        scaleX: 1,
        scaleY: 1,
        duration: 110,
        ease: 'Back.easeOut',
      })
    }
  }

  private tryJump(): void {
    const body = this.arcadeBody()
    const grounded = body.touching.down || body.blocked.down
    if (!grounded) return
    this.setDuck(false)
    this.player.setVelocityY(-620)
    this.tweens.add({
      targets: this.player,
      scaleX: 0.82,
      scaleY: 1.22,
      duration: 90,
      yoyo: true,
      ease: 'Cubic.easeOut',
    })
    sfx.jump()
  }

  private spawn(): void {
    const elapsed = this.time.now - this.startedAt
    const speed = runSpeed(elapsed)
    const kind = rollSpawnKind()
    const x = GAME_WIDTH + 40
    const neon = hexColor(this.bridge().primaryColor, 0x22d3ee)
    const mag = hexColor(this.bridge().secondaryColor, 0xa855f7)
    if (kind === 'low') {
      const s = this.prepSprite(
        this.obstacles.create(
          x,
          GROUND_TOP - 17,
          'obstacle-low',
        ) as Phaser.Physics.Arcade.Sprite,
        speed,
      )
      this.addGlow(s, mag, 4)
    } else if (kind === 'high') {
      const s = this.prepSprite(
        this.obstacles.create(
          x,
          GROUND_TOP - 70,
          'obstacle-high',
        ) as Phaser.Physics.Arcade.Sprite,
        speed,
      )
      this.addGlow(s, mag, 4)
    } else if (kind === 'collect') {
      const s = this.prepSprite(
        this.collectibles.create(
          x,
          GROUND_TOP - 90,
          'collectible',
        ) as Phaser.Physics.Arcade.Sprite,
        speed,
      )
      this.addGlow(s, neon, 8)
      this.tweens.add({
        targets: s,
        y: s.y - 10,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    } else {
      const s = this.prepSprite(
        this.powerups.create(
          x,
          GROUND_TOP - 110,
          'powerup',
        ) as Phaser.Physics.Arcade.Sprite,
        speed,
      )
      this.addGlow(s, 0x4ade80, 8)
    }
  }

  private prepSprite(
    s: Phaser.Physics.Arcade.Sprite,
    speed: number,
  ): Phaser.Physics.Arcade.Sprite {
    ;(s.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    s.setVelocityX(-speed)
    s.setImmovable(true)
    s.setDepth(1)
    return s
  }

  private recycle(group: Phaser.Physics.Arcade.Group, speed: number): void {
    for (const obj of group.getChildren()) {
      const spr = obj as Phaser.Physics.Arcade.Sprite
      if (!spr.active) continue
      spr.setVelocityX(-speed)
      if (spr.x < -80) {
        this.tweens.killTweensOf(spr)
        spr.destroy()
      }
    }
  }

  private popup(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '18px',
        color,
        stroke: '#09090b',
        strokeThickness: 4,
      })
      .setDepth(8)
    this.tweens.add({
      targets: label,
      y: y - 42,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy(),
    })
  }

  private onHitObstacle: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _player,
    obstacle,
  ) => {
    if (this.ended) return
    if (this.time.now < this.shieldUntil) {
      this.shieldUntil = 0
      const spr = obstacle as Phaser.Physics.Arcade.Sprite
      this.popup(spr.x, spr.y, 'SHIELD', '#4ade80')
      spr.destroy()
      this.cameras.main.flash(80, 34, 211, 238, false)
      return
    }
    this.finish()
  }

  private onCollect: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _player,
    item,
  ) => {
    const spr = item as Phaser.Physics.Arcade.Sprite
    const x = spr.x
    const y = spr.y
    spr.destroy()
    if (this.time.now < this.comboUntil) this.combo += 1
    else this.combo = 1
    this.comboUntil = this.time.now + COMBO_WINDOW_MS
    const gain = comboBonus(this.combo)
    this.bonusScore += gain
    this.popup(x, y, `+${gain}`, '#22d3ee')
    sfx.collect()
    this.bridge().haptic?.()
  }

  private onPower: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _player,
    item,
  ) => {
    const spr = item as Phaser.Physics.Arcade.Sprite
    this.popup(spr.x, spr.y, 'SHIELD', '#4ade80')
    spr.destroy()
    this.shieldUntil = this.time.now + SHIELD_MS
    sfx.power()
  }

  private finish(): void {
    this.ended = true
    this.physics.pause()
    this.player.setTint(0xff4d6d)
    this.cameras.main.shake(240, 0.012)
    this.cameras.main.flash(160, 255, 60, 90, false)
    sfx.die()
    const elapsed = this.time.now - this.startedAt
    const score = distanceScore(elapsed) + this.bonusScore
    this.time.delayedCall(280, () => this.bridge().onGameOver(score))
  }
}
