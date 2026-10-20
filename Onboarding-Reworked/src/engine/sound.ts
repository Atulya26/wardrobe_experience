// Synthesised, spatial sound. Quiet, short, physical — closer to glass and
// felt than to notification chimes. No assets. Things in the room sound from
// where they are: the garden through the window, the phone on the dresser.

import { useLens } from '../state/store'
import { input, on } from './input'

/** World positions (mm) of things that make sound. */
export const PLACES = {
  window: { x: -2592, z: -1850 },
  dresser: { x: -1560, z: -1640 },
  phone: { x: -1390, z: -1670 },
  wardrobe: { x: -150, z: -2440 },
  mirror: { x: 2150, z: -2996 },
} as const
type At = { x: number; z: number }
const EYE_Z = 300 // the wearer's standing position (see Scene STAND)

let ctx: AudioContext | null = null
let master: GainNode | null = null

/** Pan (-1..1) and level for a world position, relative to where the head points. */
function spatial(at: At) {
  const ex = input.eye.x
  const ez = EYE_Z + input.eye.z
  const az = Math.atan2(at.x - ex, -(at.z - ez)) * (180 / Math.PI)
  const rel = ((az - input.head.yaw + 540) % 360) - 180
  const pan = Math.max(-1, Math.min(1, Math.sin((rel * Math.PI) / 180))) * 0.9
  const dist = Math.hypot(at.x - ex, at.z - ez) / 1000
  // a little quieter when behind the ear line or far away
  const level = (0.72 + 0.28 * Math.cos((rel * Math.PI) / 180)) / Math.max(1, dist * 0.6)
  return { pan, level }
}

function out(at?: At): AudioNode {
  if (!at || !ctx || !master) return master!
  const { pan, level } = spatial(at)
  const p = ctx.createStereoPanner()
  p.pan.value = pan
  const g = ctx.createGain()
  g.gain.value = level
  p.connect(g).connect(master)
  return p
}

export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    return
  }
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0.55
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -18
  master.connect(comp).connect(ctx.destination)
  startAmbience()
}

const ok = () => ctx && master && useLens.getState().sound

type ToneOpts = { dur?: number; gain?: number; type?: OscillatorType; delay?: number; glide?: number; attack?: number; at?: At }
function tone(freq: number, opts: ToneOpts = {}) {
  if (!ok()) return
  const { dur = 0.25, gain = 0.06, type = 'sine', delay = 0, glide, attack = 0.006, at } = opts
  const t0 = ctx!.currentTime + delay
  const o = ctx!.createOscillator()
  const g = ctx!.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(out(at))
  o.start(t0)
  o.stop(t0 + dur + 0.05)
}

let noiseBuf: AudioBuffer | null = null
function getNoise() {
  if (!noiseBuf) {
    noiseBuf = ctx!.createBuffer(1, ctx!.sampleRate * 2, ctx!.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuf
}
type NoiseOpts = { dur?: number; gain?: number; from?: number; to?: number; q?: number; delay?: number; at?: At; panFrom?: number; panTo?: number }
function noise(opts: NoiseOpts = {}) {
  if (!ok()) return
  const { dur = 0.35, gain = 0.05, from = 800, to = 3000, q = 1.2, delay = 0, at, panFrom, panTo } = opts
  const t0 = ctx!.currentTime + delay
  const src = ctx!.createBufferSource()
  src.buffer = getNoise()
  const f = ctx!.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = q
  f.frequency.setValueAtTime(from, t0)
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  const g = ctx!.createGain()
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + dur * 0.3)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  let dest = out(at)
  if (panFrom !== undefined && panTo !== undefined) {
    const p = ctx!.createStereoPanner()
    p.pan.setValueAtTime(panFrom, t0)
    p.pan.linearRampToValueAtTime(panTo, t0 + dur)
    p.connect(master!)
    dest = p
  }
  src.connect(f).connect(g).connect(dest)
  src.start(t0)
  src.stop(t0 + dur + 0.05)
}

// ——— Ambience: the room is never silent ———
function startAmbience() {
  if (!ctx || !master) return
  const bed = ctx.createGain()
  bed.gain.value = 0
  bed.connect(master)

  // room tone: a very low, soft rumble
  const room = ctx.createBufferSource()
  room.buffer = getNoise()
  room.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 160
  const roomG = ctx.createGain()
  roomG.gain.value = 0.05
  room.connect(lp).connect(roomG).connect(bed)
  room.start()

  // garden air through the window: soft, breathy, placed at the window
  const air = ctx.createBufferSource()
  air.buffer = getNoise()
  air.loop = true
  air.loopStart = 0.37
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 1900
  bp.Q.value = 0.55
  const airG = ctx.createGain()
  airG.gain.value = 0.012
  const airPan = ctx.createStereoPanner()
  const airLevel = ctx.createGain()
  air.connect(bp).connect(airG).connect(airPan).connect(airLevel).connect(bed)
  air.start()
  // a slow gust
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.07
  const lfoG = ctx.createGain()
  lfoG.gain.value = 0.006
  lfo.connect(lfoG).connect(airG.gain)
  lfo.start()

  let last = 0
  on('frame', ({ t }) => {
    if (!ctx) return
    if (t - last > 90) {
      last = t
      const { pan, level } = spatial(PLACES.window)
      airPan.pan.setTargetAtTime(pan, ctx.currentTime, 0.15)
      airLevel.gain.setTargetAtTime(level, ctx.currentTime, 0.2)
    }
  })
  const apply = (on: boolean) => bed.gain.setTargetAtTime(on ? 1 : 0, ctx!.currentTime, 0.6)
  apply(useLens.getState().sound)
  useLens.subscribe((s, p) => s.sound !== p.sound && apply(s.sound))

  // birds, now and then, outside the window
  const chirp = () => {
    if (ok()) {
      const n = 2 + Math.floor(Math.random() * 4)
      const base = 2600 + Math.random() * 1400
      const at = { x: PLACES.window.x - 3000, z: PLACES.window.z + (Math.random() - 0.5) * 2000 }
      for (let i = 0; i < n; i++) {
        const d = i * (0.09 + Math.random() * 0.05)
        tone(base * (1 + Math.random() * 0.1), { dur: 0.07, gain: 0.006, glide: base * 1.45, delay: d, at })
      }
    }
    window.setTimeout(chirp, 5000 + Math.random() * 11000)
  }
  window.setTimeout(chirp, 3000)
}

let lastHover = 0
export const sound = {
  hover() {
    const now = performance.now()
    if (now - lastHover < 90) return
    lastHover = now
    tone(2400, { dur: 0.05, gain: 0.012 })
  },
  settle() {
    tone(1320, { dur: 0.3, gain: 0.03 })
    tone(1980, { dur: 0.22, gain: 0.012, delay: 0.015 })
  },
  near() {
    noise({ dur: 0.18, gain: 0.018, from: 2500, to: 4200, q: 3 })
  },
  press() {
    tone(520, { dur: 0.09, gain: 0.05, glide: 380 })
  },
  select() {
    tone(660, { dur: 0.14, gain: 0.05 })
    tone(990, { dur: 0.28, gain: 0.03, delay: 0.04 })
  },
  pinchEmpty() {
    tone(300, { dur: 0.06, gain: 0.02 })
  },
  refuse() {
    tone(240, { dur: 0.12, gain: 0.04, type: 'triangle' })
    tone(220, { dur: 0.12, gain: 0.03, type: 'triangle', delay: 0.09 })
  },
  listen() {
    tone(880, { dur: 0.12, gain: 0.025 })
    tone(1320, { dur: 0.16, gain: 0.02, delay: 0.08 })
  },
  /** dir: which way it was flung, so the whoosh travels that way */
  swipe(dir: number = 0) {
    noise({ dur: 0.38, gain: 0.06, from: 600, to: 2800, q: 0.8, panFrom: 0, panTo: Math.max(-1, Math.min(1, dir)) * 0.85 })
  },
  scan() {
    noise({ dur: 2.2, gain: 0.025, from: 180, to: 1400, q: 4 })
  },
  tick(at?: At) {
    tone(1760, { dur: 0.08, gain: 0.03, at })
  },
  success(at?: At) {
    ;[523.25, 659.25, 783.99].forEach((f, i) => tone(f, { dur: 0.9, gain: 0.035, delay: i * 0.09, attack: 0.02, at }))
  },
  bloom() {
    tone(392, { dur: 1.4, gain: 0.035, attack: 0.25 })
    tone(587.33, { dur: 1.6, gain: 0.025, attack: 0.35, delay: 0.1 })
    tone(880, { dur: 1.8, gain: 0.015, attack: 0.4, delay: 0.2 })
  },
  hum(on: boolean, at?: At) {
    if (on) tone(110, { dur: 1.2, gain: 0.02, attack: 0.3, at })
  },
}
