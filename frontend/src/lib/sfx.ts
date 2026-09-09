let ctx: AudioContext | null = null
let muted = false

export function setMuted(next: boolean): void {
  muted = next
}

export function isMuted(): boolean {
  return muted
}

function audio(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AC) return null
  ctx ??= new AC()
  return ctx
}

function beep(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
): void {
  const ac = audio()
  if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.value = 0.04
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + duration)
}

export const sfx = {
  jump: () => beep(420, 0.08),
  duck: () => beep(220, 0.06, 'triangle'),
  collect: () => beep(760, 0.07),
  power: () => beep(520, 0.12),
  die: () => beep(110, 0.25, 'sawtooth'),
}
