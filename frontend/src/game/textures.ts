import Phaser from 'phaser'
import type { ThemePalette } from '@/game/themes'

export function hexColor(hex: string, fallback: number): number {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return Number.isFinite(n) ? n : fallback
}

export function generateWorldTextures(
  scene: Phaser.Scene,
  theme: ThemePalette,
  primary: number,
  secondary: number,
): void {
  pixel(scene, 'dust', 0xffffff)
  mountains(scene, 'mountains', theme.far, primary)
  city(scene, 'city', theme.near, primary, secondary)
  gridFloor(scene, 'grid-floor', primary)
  neonBlock(scene, 'player', 32, 48, primary, 0xffffff)
  neonBlock(scene, 'obstacle-low', 36, 36, secondary, primary)
  neonBlock(scene, 'obstacle-high', 64, 22, secondary, primary)
  orb(scene, 'collectible', 20, secondary)
  crystal(scene, 'powerup', 24, 0x4ade80)
  neonBlock(scene, 'ground', 960, 44, 0x09090b, primary)
}

function gfx(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics()
  g.setVisible(false)
  return g
}

function pixel(scene: Phaser.Scene, key: string, color: number): void {
  const g = gfx(scene)
  g.fillStyle(color, 1)
  g.fillRect(0, 0, 2, 2)
  g.generateTexture(key, 2, 2)
  g.destroy()
}

function mountains(
  scene: Phaser.Scene,
  key: string,
  fill: number,
  glow: number,
): void {
  const w = 640
  const h = 220
  const g = gfx(scene)
  g.fillStyle(0x09090b, 1)
  g.fillRect(0, 0, w, h)
  g.fillStyle(fill, 1)
  g.fillTriangle(0, h, 140, 40, 280, h)
  g.fillTriangle(180, h, 360, 20, 540, h)
  g.fillTriangle(420, h, 560, 70, 640, h)
  g.lineStyle(2, glow, 0.45)
  g.lineBetween(0, h, 140, 40)
  g.lineBetween(140, 40, 280, h)
  g.lineBetween(180, h, 360, 20)
  g.lineBetween(360, 20, 540, h)
  g.generateTexture(key, w, h)
  g.destroy()
}

function city(
  scene: Phaser.Scene,
  key: string,
  building: number,
  windowColor: number,
  accent: number,
): void {
  const w = 720
  const h = 260
  const g = gfx(scene)
  g.fillStyle(0x050508, 1)
  g.fillRect(0, 0, w, h)
  let x = 0
  let i = 0
  while (x < w) {
    const bw = 28 + ((i * 17) % 42)
    const bh = 70 + ((i * 29) % 160)
    g.fillStyle(building, 1)
    g.fillRect(x, h - bh, bw - 3, bh)
    g.fillStyle(windowColor, 0.85)
    for (let wy = h - bh + 8; wy < h - 10; wy += 10) {
      for (let wx = x + 5; wx < x + bw - 10; wx += 8) {
        if ((wx + wy + i) % 3 !== 0) g.fillRect(wx, wy, 3, 5)
      }
    }
    if (i % 4 === 0) {
      g.fillStyle(accent, 0.7)
      g.fillRect(x + 4, h - bh, 3, bh)
    }
    x += bw
    i += 1
  }
  g.lineStyle(1, accent, 0.25)
  g.lineBetween(0, h - 1, w, h - 1)
  g.generateTexture(key, w, h)
  g.destroy()
}

function gridFloor(scene: Phaser.Scene, key: string, glow: number): void {
  const w = 240
  const h = 120
  const g = gfx(scene)
  g.fillStyle(0x09090b, 1)
  g.fillRect(0, 0, w, h)
  g.lineStyle(1, glow, 0.22)
  for (let y = 0; y <= h; y += 20) g.lineBetween(0, y, w, y)
  for (let x = 0; x <= w; x += 24) g.lineBetween(x, 0, x, h)
  g.lineStyle(2, glow, 0.55)
  g.lineBetween(0, 0, w, 0)
  g.generateTexture(key, w, h)
  g.destroy()
}

function neonBlock(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  fill: number,
  edge: number,
): void {
  const g = gfx(scene)
  g.fillStyle(fill, 0.95)
  g.fillRoundedRect(0, 0, w, h, 6)
  g.lineStyle(2, edge, 0.9)
  g.strokeRoundedRect(1, 1, w - 2, h - 2, 6)
  g.fillStyle(0xffffff, 0.18)
  g.fillRoundedRect(4, 3, Math.max(8, w * 0.4), 6, 3)
  g.generateTexture(key, w, h)
  g.destroy()
}

function orb(scene: Phaser.Scene, key: string, r: number, color: number): void {
  const d = r * 2
  const g = gfx(scene)
  g.fillStyle(color, 0.25)
  g.fillCircle(r, r, r)
  g.fillStyle(color, 1)
  g.fillCircle(r, r, r * 0.55)
  g.fillStyle(0xffffff, 0.7)
  g.fillCircle(r - 3, r - 4, r * 0.18)
  g.generateTexture(key, d, d)
  g.destroy()
}

function crystal(
  scene: Phaser.Scene,
  key: string,
  size: number,
  color: number,
): void {
  const g = gfx(scene)
  g.fillStyle(color, 0.3)
  g.fillTriangle(size, 0, size * 2, size, size, size * 2)
  g.fillTriangle(size, 0, 0, size, size, size * 2)
  g.fillStyle(color, 1)
  g.fillTriangle(size, 4, size * 1.6, size, size, size * 1.7)
  g.generateTexture(key, size * 2, size * 2)
  g.destroy()
}
