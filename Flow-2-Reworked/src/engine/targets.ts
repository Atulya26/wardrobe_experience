// Attention registry. Every interactive thing — world object or lens surface —
// registers here. Each frame we resolve what the eyes rest on, how long, and
// what the hand is near. Visual response is driven through data-attributes and
// CSS variables on the element so React never re-renders per frame.

import { input, on, lockHead, unlockHead, syncHeadTargetToCurrent, type PinchSource } from './input'
import { useLens } from '../state/store'
import { sound } from './sound'

export type SelectMethod = PinchSource
export type TargetOpts = {
  /** ms of steady attention before the target is "settled" (ready) */
  dwellMs?: number
  /** px of forgiveness around the element — gaze is imprecise */
  pad?: number
  /** lens surfaces (2) win over world objects (1) */
  priority?: number
  enabled?: boolean
  /** if true, a pinch before attention settles is refused */
  requireSettle?: boolean
  /** accepts direct hand interaction */
  hand?: boolean
  /** world objects participate in the focus field (depth of field) */
  focusField?: boolean
  quiet?: boolean
  /** distance from the eye in mm — nearer subjects throw the room further out of focus */
  depth?: number
  /** show the gaze aperture closing while attention settles */
  iris?: boolean
  onEnter?: () => void
  onLeave?: () => void
  onSettle?: () => void
  onSelect?: (method: SelectMethod) => void
  /** selectable even without an onSelect handler (listened to via onTargetEvent) */
  selectable?: boolean
  onHandEnter?: () => void
  onHandLeave?: () => void
  onTouch?: () => void
  grab?: {
    onGrab?: () => void
    onDrag?: (dx: number, dy: number) => void
    onRelease?: () => void
    onCancel?: () => void
  }
}

type Target = {
  id: string
  el: HTMLElement
  opts: TargetOpts
  dwell: number
  settled: boolean
  rect: DOMRect | null
  hand: number
}

export type TargetEvent = { type: 'enter' | 'leave' | 'settle' | 'select' | 'handEnter' | 'handLeave'; id: string; method?: SelectMethod }
const listeners = new Set<(e: TargetEvent) => void>()
export function onTargetEvent(fn: (e: TargetEvent) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const fire = (e: TargetEvent) => listeners.forEach((fn) => fn(e))

const targets = new Map<string, Target>()
let attended: Target | null = null
let candidate: Target | null = null
let candidateTime = 0
let handTarget: Target | null = null
let pressed: Target | null = null
let grabbed: Target | null = null

export function registerTarget(id: string, el: HTMLElement, opts: TargetOpts) {
  const existing = targets.get(id)
  const t: Target = existing ?? { id, el, opts, dwell: 0, settled: false, rect: null, hand: 0 }
  t.el = el
  t.opts = opts
  targets.set(id, t)
  el.dataset.target = id
  return () => {
    if (targets.get(id)?.el === el) targets.delete(id)
    if (attended === t) { attended = null; unlockHead('attention') }
    if (candidate === t) candidate = null
    if (keyboardTarget === t) { keyboardTarget = null; input.keyboardFocus = null }
    if (handTarget === t) handTarget = null
    if (pressed === t) pressed = null
    if (grabbed === t) {
      grabbed = null
      unlockHead('grab')
      input.gazeFrozen = input.handRaised
    }
  }
}
export function updateTargetOpts(id: string, opts: TargetOpts) {
  const t = targets.get(id)
  if (t) t.opts = opts
}

export function getAttendedRect(): { rect: DOMRect; focusField: boolean } | null {
  if (!attended?.rect) return null
  return { rect: attended.rect, focusField: !!attended.opts.focusField }
}
/** What the gaze aperture needs to draw itself. */
export function getAttendedInfo() {
  if (!attended?.rect) return null
  return { id: attended.id, progress: attended.dwell / dwellOf(attended), settled: attended.settled, iris: !!attended.opts.iris, focusField: !!attended.opts.focusField, depth: attended.opts.depth ?? 1600, rect: attended.rect }
}
export function getHandProximity(id: string) {
  const t = targets.get(id)
  return t && t === handTarget ? t.hand : 0
}
export function getTargetRect(id: string) {
  return targets.get(id)?.rect ?? null
}

const dwellOf = (t: Target) => (t.opts.dwellMs ?? 280) * useLens.getState().dwellScale

function contains(r: DOMRect, x: number, y: number, pad: number) {
  return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad
}
function distToRect(r: DOMRect, x: number, y: number) {
  const dx = Math.max(r.left - x, 0, x - r.right)
  const dy = Math.max(r.top - y, 0, y - r.bottom)
  return Math.hypot(dx, dy)
}

function publish() {
  const s = useLens.getState()
  const a = attended?.id ?? null
  const settled = !!attended?.settled
  const h = handTarget?.id ?? null
  if (s.attended !== a || s.settled !== settled || s.handFocus !== h)
    useLens.setState({ attended: a, settled, handFocus: h })
}

function frame(dt: number, immediate = false) {
  const gx = input.gaze.x
  const gy = input.gaze.y
  let best: Target | null = null
  let bestScore = -Infinity

  for (const t of targets.values()) {
    if (t.opts.enabled === false || !t.el.isConnected) {
      t.rect = null
      continue
    }
    const r = t.el.getBoundingClientRect()
    t.rect = r
    if (r.width < 1 || r.height < 1) continue
    const pad = t.opts.pad ?? 10
    if (!input.handRaised || input.gazeFrozen) {
      if (contains(r, gx, gy, pad)) {
        const inside = contains(r, gx, gy, 0) ? 1 : 0
        const score = (t.opts.priority ?? 1) * 1e7 + inside * 1e6 - r.width * r.height * 0.001
        if (score > bestScore) {
          bestScore = score
          best = t
        }
      }
    }
  }

  // While something is grabbed, attention stays with it.
  if (grabbed) best = grabbed

  // Hysteresis — a glance across a target shouldn't steal attention.
  if (best !== attended) {
    if (best !== candidate) {
      candidate = best
      candidateTime = 0
    }
    candidateTime += dt * 1000
    const threshold = immediate ? 0 : attended && best ? 70 : best ? 40 : 90
    if (candidateTime >= threshold) {
      const prev = attended
      attended = best
      candidate = null
      if (prev) {
        prev.el.dataset.gaze = 'off'
        prev.opts.onLeave?.()
        fire({ type: 'leave', id: prev.id })
        if (pressed === prev) {
          pressed.el.dataset.pressed = 'false'
          pressed = null
        }
      }
      if (attended) {
        attended.el.dataset.gaze = 'on'
        attended.opts.onEnter?.()
        fire({ type: 'enter', id: attended.id })
        if (!attended.opts.quiet) sound.hover()
      }
    }
  } else {
    candidate = null
  }

  // Pause the view as soon as attention finds a target: it must not flee a dwell.
  if (best && !input.manualLook) lockHead('attention')
  else unlockHead('attention')

  for (const t of targets.values()) {
    if (!t.rect) continue
    if (t === attended && t === best) {
      t.dwell = Math.min(t.dwell + dt * 1000, dwellOf(t))
      const r = t.rect
      t.el.style.setProperty('--gx', `${((gx - r.left) / r.width) * 100}%`)
      t.el.style.setProperty('--gy', `${((gy - r.top) / r.height) * 100}%`)
    } else {
      // attention is reversible — partial focus drains away visibly
      t.dwell = 0
      if (t.settled && t.dwell < dwellOf(t) * 0.5) {
        t.settled = false
        t.el.dataset.settled = 'false'
      }
    }
    const p = t.dwell / dwellOf(t)
    t.el.style.setProperty('--dwell', p.toFixed(3))
    if (t === attended && !t.settled && p >= 1) {
      t.settled = true
      t.el.dataset.settled = 'true'
      if (!t.opts.quiet && (t.opts.onSettle || t.opts.requireSettle)) sound.settle()
      t.opts.onSettle?.()
      fire({ type: 'settle', id: t.id })
    }
  }

  // Hand proximity — distinct from gaze.
  let nextHand: Target | null = null
  if (input.handRaised) {
    const fx = input.hand.x
    const fy = input.hand.y
    let bestD = Infinity
    for (const t of targets.values()) {
      if (!t.rect || t.opts.hand === false || t.opts.enabled === false) continue
      const d = distToRect(t.rect, fx, fy)
      const prox = Math.max(0, 1 - d / 120)
      t.hand = prox
      if (prox > 0 && d < bestD) {
        bestD = d
        nextHand = t
      }
    }
  }
  for (const t of targets.values()) {
    if (!input.handRaised) t.hand = 0
    const val = t === nextHand ? t.hand : 0
    t.el.style.setProperty('--hand', val.toFixed(3))
    if (t.rect && t === nextHand) {
      t.el.style.setProperty('--hx', `${((input.hand.x - t.rect.left) / t.rect.width) * 100}%`)
      t.el.style.setProperty('--hy', `${((input.hand.y - t.rect.top) / t.rect.height) * 100}%`)
    }
  }
  if (nextHand !== handTarget) {
    if (handTarget) {
      handTarget.el.dataset.hand = 'off'
      handTarget.opts.onHandLeave?.()
      fire({ type: 'handLeave', id: handTarget.id })
    }
    handTarget = nextHand
    if (handTarget) {
      handTarget.el.dataset.hand = 'near'
      handTarget.opts.onHandEnter?.()
      fire({ type: 'handEnter', id: handTarget.id })
      sound.near()
    }
  }

  publish()
}

function refuse(t: Target) {
  t.el.dataset.refuse = 'true'
  sound.refuse()
  window.setTimeout(() => (t.el.dataset.refuse = 'false'), 420)
}

function onPinchStart(source: PinchSource) {
  // Resolve a fresh pointer-down, including a click before the next animation frame.
  if (source === 'pinch' || source === 'direct') frame(0, true)
  const t = source === 'direct' ? handTarget : attended
  if (!t || t.opts.enabled === false || !t.el.isConnected) {
    sound.pinchEmpty()
    return
  }
  if (source === 'direct' && t.hand < 0.55) {
    sound.pinchEmpty()
    return
  }
  if (t.opts.grab) {
    grabbed = t
    t.el.dataset.grabbed = 'true'
    lockHead('grab')
    input.gazeFrozen = true
    t.opts.grab.onGrab?.()
    sound.press()
    return
  }
  if (t.opts.requireSettle && !t.settled && source !== 'direct') {
    refuse(t)
    return
  }
  pressed = t
  t.el.dataset.pressed = 'true'
  sound.press()
}

function onPinchEnd(source: PinchSource) {
  if (grabbed) {
    const g = grabbed
    grabbed = null
    g.el.dataset.grabbed = 'false'
    g.opts.grab?.onRelease?.()
    input.gazeFrozen = input.handRaised
    syncHeadTargetToCurrent()
    unlockHead('grab')
    return
  }
  const t = pressed
  pressed = null
  if (!t) return
  t.el.dataset.pressed = 'false'
  const still = source === 'direct' ? handTarget === t : attended === t
  if (still && t.opts.enabled !== false) {
    t.opts.onSelect?.(source)
    fire({ type: 'select', id: t.id, method: source })
    if (!t.opts.quiet) sound.select()
    flash(t)
  }
}

function flash(t: Target) {
  t.el.dataset.committed = 'true'
  window.setTimeout(() => (t.el.dataset.committed = 'false'), 500)
}

let voiceHeard = false
function onVoice(phase: 'start' | 'heard' | 'end' | 'cancel') {
  const set = useLens.setState
  if (phase === 'cancel') {
    voiceHeard = false
    set({ voice: 'idle', voiceTranscript: '' })
  } else if (phase === 'start') {
    voiceHeard = false
    set({ voice: 'listening', voiceTranscript: '' })
    sound.listen()
  } else if (phase === 'heard') {
    voiceHeard = true
    set({ voice: 'heard', voiceTranscript: attended ? 'Select this' : 'Select' })
  } else if (phase === 'end') {
    if (!voiceHeard) {
      set({ voice: 'idle', voiceTranscript: '' })
      return
    }
    const t = attended
    if (t && (t.opts.onSelect || t.opts.selectable) && t.opts.enabled !== false) {
      t.opts.onSelect?.('voice')
      fire({ type: 'select', id: t.id, method: 'voice' })
      flash(t)
      sound.select()
      set({ voice: 'idle' })
    } else {
      set({ voice: 'empty' })
      sound.refuse()
      window.setTimeout(() => useLens.setState({ voice: 'idle', voiceTranscript: '' }), 1400)
    }
  }
}

function onTab(dir: 1 | -1) {
  const visible = [...targets.values()]
    .filter((t) => t.rect && t.rect.width > 0 && t.rect.right > 0 && t.rect.left < innerWidth && t.rect.bottom > 0 && t.rect.top < innerHeight && t.opts.enabled !== false && (t.opts.onSelect || t.opts.onSettle || t.opts.grab))
    .sort((a, b) => (b.opts.priority ?? 1) - (a.opts.priority ?? 1) || a.rect!.left - b.rect!.left)
  if (!visible.length) return
  const i = attended ? visible.indexOf(attended) : -1
  const next = visible[(i + dir + visible.length) % visible.length]
  keyboardTarget = next
  useLens.setState({ keyboardMode: true })
}
let keyboardTarget: Target | null = null

export function startTargets() {
  on('targets', ({ dt }) => {
    if (keyboardTarget) {
      if (!keyboardTarget.el.isConnected || keyboardTarget.opts.enabled === false) { keyboardTarget = null; input.keyboardFocus = null }
      else if (keyboardTarget.rect) {
        const r = keyboardTarget.rect
        input.keyboardFocus = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      }
    }
    if (!input.keyboardFocus) keyboardTarget = null
    frame(dt)
  })
  on('pinchstart', ({ source }) => onPinchStart(source))
  on('pinchend', ({ source }) => onPinchEnd(source))
  on('drag', ({ dx, dy }) => grabbed?.opts.grab?.onDrag?.(dx, dy))
  on('voice', ({ phase }) => onVoice(phase))
  on('tab', ({ dir }) => onTab(dir))
  on('escape', () => {
    if (pressed) pressed.el.dataset.pressed = 'false'
    pressed = null
    if (grabbed) {
      grabbed.el.dataset.grabbed = 'false'
      grabbed.opts.grab?.onCancel?.()
      grabbed = null
    }
    unlockHead('grab')
    unlockHead('attention')
    input.gazeFrozen = input.handRaised
  })
  on('hand', ({ raised }) => useLens.setState({ handRaised: raised }))
}
