// Input engine — translates laptop input into the lens' vocabulary.
// Pointer = eyes (fast), head follows eyes (slow spring), click = pinch,
// Space/H = raise hand, V = voice, wheel/trackpad pinch = zoom, flick/← → = swipe.

type Vec = { x: number; y: number }

export type PinchSource = 'pinch' | 'key' | 'voice' | 'direct'
type Events = {
  pinchstart: { source: PinchSource }
  pinchend: { source: PinchSource; moved: number }
  drag: { dx: number; dy: number }
  zoom: { delta: number }
  swipe: { dir: -1 | 1; source: 'flick' | 'trackpad' | 'key' }
  voice: { phase: 'start' | 'heard' | 'end' | 'cancel' }
  escape: { reason?: 'escape' | 'recenter' | 'blur' | 'pointercancel' }
  tab: { dir: 1 | -1 }
  hand: { raised: boolean }
  view: { dt: number; t: number }
  anchor: { dt: number; t: number }
  targets: { dt: number; t: number }
  frame: { dt: number; t: number }
}
type Handler<K extends keyof Events> = (e: Events[K]) => void

const handlers: { [K in keyof Events]?: Set<Handler<K>> } = {}

export function on<K extends keyof Events>(type: K, fn: Handler<K>) {
  const set = (handlers[type] ??= new Set() as never) as Set<Handler<K>>
  set.add(fn)
  return () => {
    set.delete(fn)
  }
}
function emit<K extends keyof Events>(type: K, e: Events[K]) {
  const set = handlers[type] as Set<Handler<K>> | undefined
  set?.forEach((fn) => fn(e))
}

const cx = () => Math.max(1, window.innerWidth / 2)
const cy = () => Math.max(1, window.innerHeight / 2)

export const input = {
  pointer: { x: 0, y: 0 } as Vec,
  gaze: { x: 0, y: 0 } as Vec,
  hand: { x: 0, y: 0 } as Vec,
  head: { yaw: 0, pitch: 0 },
  headTarget: { yaw: 0, pitch: 0 },
  /** max head rotation in degrees at screen edge */
  range: { yaw: 40, pitch: 16 },
  /** Eye position offset in mm (lean + breath), applied around the neck pivot by the camera. */
  eye: { x: 0, y: 0, z: 0 },
  eyeTarget: { x: 0, y: 0, z: 0 },
  /** breathing micro-motion; off in reduced motion */
  breathe: true,
  headLocks: new Set<string>(),
  gazeFrozen: false,
  handRaised: false,
  handToggled: false,
  pinching: false,
  pinchSource: 'pinch' as PinchSource,
  voiceActive: false,
  /** id of a target being steered to by keyboard (Tab) */
  keyboardFocus: null as Vec | null,
  manualLook: false,
  lastPointerMove: 0,
  t: 0,
}

export function lockHead(key: string) {
  if (!input.headLocks.size) syncHeadTargetToCurrent()
  input.headLocks.add(key)
}
export function unlockHead(key: string) {
  input.headLocks.delete(key)
}

function isChrome(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('[data-chrome]')
}

let pinchStartAt: Vec = { x: 0, y: 0 }
let pinchStartTime = 0
let wheelX = 0
let wheelXTimer = 0
let voiceTimer = 0
let started = false

function setHand(raised: boolean) {
  if (input.handRaised === raised) return
  input.handRaised = raised
  input.gazeFrozen = raised
  if (raised) {
    input.hand.x = input.pointer.x
    input.hand.y = input.pointer.y
    lockHead('hand')
  } else {
    unlockHead('hand')
  }
  emit('hand', { raised })
}

function startPinch(source: PinchSource) {
  if (input.pinching) return
  input.pinching = true
  input.pinchSource = source
  pinchStartAt = { ...input.pointer }
  pinchStartTime = performance.now()
  emit('pinchstart', { source })
}
function endPinch() {
  if (!input.pinching) return
  input.pinching = false
  const dx = input.pointer.x - pinchStartAt.x
  const dy = input.pointer.y - pinchStartAt.y
  const moved = Math.hypot(dx, dy)
  const dt = performance.now() - pinchStartTime
  // A deliberate flick: fast, mostly horizontal.
  if (input.pinchSource === 'pinch' && Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 550) {
    emit('swipe', { dir: dx > 0 ? 1 : -1, source: 'flick' })
  }
  emit('pinchend', { source: input.pinchSource, moved })
}

export function startInput() {
  if (started) return
  started = true
  input.pointer = { x: cx(), y: cy() }
  input.gaze = { ...input.pointer }

  window.addEventListener('pointermove', (e) => {
    if (isChrome(e.target)) return
    // dev-only: scripted views can pin the pointer against stray real mouse moves
    if (import.meta.env.DEV && e.isTrusted && (window as unknown as { __pin?: boolean }).__pin) return
    const dx = e.clientX - input.pointer.x
    const dy = e.clientY - input.pointer.y
    input.pointer.x = e.clientX
    input.pointer.y = e.clientY
    input.manualLook = false
    input.lastPointerMove = performance.now()
    if (Math.abs(dx) + Math.abs(dy) > 2) input.keyboardFocus = null
    if (input.pinching) emit('drag', { dx, dy })
  })

  window.addEventListener('pointerdown', (e) => {
    if (isChrome(e.target) || e.button !== 0) return
    input.pointer.x = e.clientX
    input.pointer.y = e.clientY
    if (!input.gazeFrozen) input.gaze = { ...input.pointer }
    startPinch(input.handRaised ? 'direct' : 'pinch')
  })
  window.addEventListener('pointerup', () => endPinch())
  window.addEventListener('pointercancel', () => cancelInput('pointercancel'))
  window.addEventListener('blur', () => cancelInput('blur'))

  window.addEventListener(
    'wheel',
    (e) => {
      if (isChrome(e.target)) return
      e.preventDefault()
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2
      if (horizontal && !e.ctrlKey) {
        wheelX += e.deltaX
        clearTimeout(wheelXTimer)
        wheelXTimer = window.setTimeout(() => (wheelX = 0), 180)
        if (Math.abs(wheelX) > 140) {
          emit('swipe', { dir: wheelX > 0 ? -1 : 1, source: 'trackpad' })
          wheelX = 0
        }
        return
      }
      // Trackpad pinch arrives as ctrl+wheel; a mouse wheel is slower per notch.
      const delta = e.ctrlKey ? -e.deltaY * 0.012 : -e.deltaY * 0.0022
      emit('zoom', { delta })
    },
    { passive: false },
  )

  window.addEventListener('keydown', (e) => {
    if (isChrome(e.target) && e.key !== 'Escape') return
    if (e.metaKey || e.altKey) return
    const k = e.key
    if (k === ' ') {
      e.preventDefault()
      if (!e.repeat && !input.handToggled) setHand(true)
    } else if (k === 'h' || k === 'H') {
      if (e.repeat) return
      input.handToggled = !input.handRaised
      setHand(!input.handRaised)
    } else if (k === 'Enter') {
      if (!e.repeat) startPinch(input.handRaised ? 'direct' : 'key')
    } else if (k === 'v' || k === 'V') {
      if (e.repeat || input.voiceActive) return
      input.voiceActive = true
      emit('voice', { phase: 'start' })
      voiceTimer = window.setTimeout(() => emit('voice', { phase: 'heard' }), 650)
    } else if (k === '=' || k === '+') {
      emit('zoom', { delta: 0.18 })
    } else if (k === '-' || k === '_') {
      emit('zoom', { delta: -0.18 })
    } else if (k === 'r' || k === 'R') {
      recenterView()
    } else if (e.shiftKey && k.startsWith('Arrow')) {
      e.preventDefault()
      if (input.headLocks.size === 0 || input.headLocks.size === 1 && input.headLocks.has('attention')) {
        unlockHead('attention')
        input.manualLook = true
        input.headTarget.yaw = clamp(input.headTarget.yaw + (k === 'ArrowLeft' ? -5 : k === 'ArrowRight' ? 5 : 0), -input.range.yaw, input.range.yaw)
        input.headTarget.pitch = clamp(input.headTarget.pitch + (k === 'ArrowUp' ? 4 : k === 'ArrowDown' ? -4 : 0), -input.range.pitch, input.range.pitch)
      }
    } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault()
      emit('swipe', { dir: k === 'ArrowLeft' ? -1 : 1, source: 'key' })
    } else if (k === 'Escape') {
      cancelInput()
    } else if (k === 'Tab') {
      e.preventDefault()
      emit('tab', { dir: e.shiftKey ? -1 : 1 })
    }
  })
  window.addEventListener('keyup', (e) => {
    const k = e.key
    if (k === ' ' && !input.handToggled) setHand(false)
    else if (k === 'Enter') endPinch()
    else if ((k === 'v' || k === 'V') && input.voiceActive) {
      input.voiceActive = false
      clearTimeout(voiceTimer)
      emit('voice', { phase: 'end' })
    }
  })

  let last = performance.now()
  const loop = (now: number) => {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
    last = now
    input.t = now
    step(dt)
    // Project the camera and anchors before resolving this frame's attention.
    emit('view', { dt, t: now })
    emit('anchor', { dt, t: now })
    emit('targets', { dt, t: now })
    emit('frame', { dt, t: now })
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}

const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)

function step(dt: number) {
  const p = input.pointer
  // Eyes: quick, nearly immediate.
  if (input.keyboardFocus) {
    const k = damp(18, dt)
    input.gaze.x += (input.keyboardFocus.x - input.gaze.x) * k
    input.gaze.y += (input.keyboardFocus.y - input.gaze.y) * k
  } else if (!input.gazeFrozen) {
    input.gaze.x = p.x
    input.gaze.y = p.y
  }
  if (input.handRaised) {
    const k = damp(20, dt)
    input.hand.x += (p.x - input.hand.x) * k
    input.hand.y += (p.y - input.hand.y) * k
  }

  // Head: follows the eyes, unhurried. Locked while manipulating or calibrating.
  if (input.headLocks.size === 0 && !input.manualLook) {
    if (input.keyboardFocus) {
      // steer the head so the keyboard-focused target drifts toward centre
      const nx = (input.keyboardFocus.x - cx()) / cx()
      const ny = (input.keyboardFocus.y - cy()) / cy()
      input.headTarget.yaw = clamp(input.headTarget.yaw + nx * 40 * dt, -input.range.yaw, input.range.yaw)
      input.headTarget.pitch = clamp(input.headTarget.pitch - ny * 20 * dt, -input.range.pitch, input.range.pitch)
    } else {
      const nx = clamp((p.x - cx()) / cx(), -1, 1)
      const ny = clamp((p.y - cy()) / cy(), -1, 1)
      // ease the curve so the centre of the screen is calm
      input.headTarget.yaw = shape(nx) * input.range.yaw
      input.headTarget.pitch = -shape(ny) * input.range.pitch
      // the body leans a little into where you look, and the head drops forward to look down
      const lean = input.range.yaw / 40
      input.eyeTarget.x = shape(nx) * 34 * lean
      input.eyeTarget.z = -Math.max(0, ny) * 22 * lean
    }
  }
  // never let a bad frame (zero-size window, NaN input) poison the head for good
  if (!Number.isFinite(input.headTarget.yaw) || !Number.isFinite(input.headTarget.pitch)) input.headTarget = { yaw: 0, pitch: 0 }
  if (!Number.isFinite(input.head.yaw) || !Number.isFinite(input.head.pitch)) input.head = { yaw: 0, pitch: 0 }
  if (!Number.isFinite(input.eyeTarget.x) || !Number.isFinite(input.eyeTarget.z)) input.eyeTarget = { x: 0, y: 0, z: 0 }
  if (!Number.isFinite(input.eye.x) || !Number.isFinite(input.eye.z)) input.eye = { x: 0, y: 0, z: 0 }
  const hk = input.headLocks.size ? 0 : damp(10, dt)
  input.head.yaw += (input.headTarget.yaw - input.head.yaw) * hk
  input.head.pitch += (input.headTarget.pitch - input.head.pitch) * hk
  const ek = input.headLocks.size ? 0 : damp(10, dt)
  input.eye.x += (input.eyeTarget.x - input.eye.x) * ek
  input.eye.z += (input.eyeTarget.z - input.eye.z) * ek
  // breathing: ~4.6 s cycle, about a millimetre of rise
  input.eye.y = input.breathe && !input.headLocks.size && performance.now() - input.lastPointerMove < 600 ? Math.sin((input.t / 4600) * Math.PI * 2) * 0.3 : 0
}

function shape(n: number) {
  return Math.sign(n) * Math.pow(Math.abs(n), 1.35)
}
export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}

/** Used when unlocking the head so the view doesn't lurch. */
export function syncHeadTargetToCurrent() {
  input.headTarget.yaw = input.head.yaw
  input.headTarget.pitch = input.head.pitch
}

/** Cancel is not a release/commit, including when the window loses focus. */
export function cancelInput(reason: 'escape' | 'recenter' | 'blur' | 'pointercancel' = 'escape') {
  input.pinching = false
  input.voiceActive = false
  clearTimeout(voiceTimer)
  emit('voice', { phase: 'cancel' })
  emit('escape', { reason })
  input.handToggled = false
  setHand(false)
  input.gazeFrozen = false
  input.keyboardFocus = null
}

export function recenterView() {
  cancelInput('recenter')
  input.manualLook = true
  input.headTarget = { yaw: 0, pitch: 0 }
  input.eyeTarget = { x: 0, y: 0, z: 0 }
  input.pointer = { x: cx(), y: cy() }
  input.gaze = { ...input.pointer }
}
