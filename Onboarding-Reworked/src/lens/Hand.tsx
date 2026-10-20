import { useEffect, useRef } from 'react'
import { preload } from 'react-dom'
import { useFrame } from '../engine/hooks'
import { input } from '../engine/input'
import { useLens } from '../state/store'
import { gestureFeedback, startGestureFeedback } from '../engine/gestureFeedback'

/**
 * The wearer's hand, drawn from two photographed poses registered on the same
 * wrist and forearm. It comes from a shoulder below and to the right, angles
 * toward wherever it reaches, gets smaller as it reaches further away, and moves
 * into a pinch rather than jumping between pictures. Visual feedback for laptop
 * input — not live hand sensing.
 */
const E = 280 / 768 // display px per source px
const CELL = { w: 988 * E, h: 2424 * E }
const TIP_OPEN = { x: 321 * E, y: 69 * E }
const TIP_PINCH = { x: 240.7 * E, y: 224.9 * E }
const FOREARM_TILT = -9.4 // the photographed forearm already leans this way (deg)
const deg = 180 / Math.PI

export function Hand({ ghost = false, side = 'right' }: { ghost?: boolean; side?: 'left' | 'right' }) {
  const root = useRef<HTMLDivElement>(null)
  const rig = useRef<HTMLDivElement>(null)
  const open = useRef<HTMLDivElement>(null)
  const pinch = useRef<HTMLDivElement>(null)
  const cue = useRef<HTMLDivElement>(null)
  const m = useRef({ rise: 0, pinch: 0, rot: 0, lastX: 0, lastY: 0 })
  const teaching = useLens((s) => s.stage >= 12 && s.stage <= 19)
  useEffect(() => { if (!ghost && side === 'right') return startGestureFeedback() }, [ghost, side])
  const reduce = useLens((s) => s.reduceMotion)
  const tone = useLens((s) => s.handTone)

  useFrame((dt, t) => {
    const s = m.current
    const W = window.innerWidth
    const H = window.innerHeight
    const feedback = gestureFeedback
    const acting = t < feedback.until || feedback.active && input.pinching
    const zoom = acting && feedback.mode === 'zoom'
    const raised = side === 'left' ? zoom : ghost || input.handRaised || acting
    const wasHidden = s.rise < .02
    s.rise += ((raised ? 1 : 0) - s.rise) * (1 - Math.exp(-dt * 12))
    const closed = ghost ? false : input.pinching || acting && t < feedback.closedUntil
    s.pinch += ((closed ? 1 : 0) - s.pinch) * (1 - Math.exp(-dt * 26))
    const swiping = acting && feedback.mode === 'swipe'
    const progress = Math.min(1, (t - feedback.started) / 700)
    const livePinch = input.pinching && feedback.mode === 'pinch' && feedback.source !== 'key'
    const fx = livePinch ? input.pointer.x : feedback.x
    const fy = livePinch ? input.pointer.y : feedback.y
    let x = ghost ? W * .68 : zoom ? feedback.x + (side === 'left' ? -1 : 1) * feedback.spread : acting ? fx + (swiping ? feedback.dir * progress * 250 : 0) : input.hand.x
    let y = ghost ? H * .44 : zoom ? feedback.y + 70 : acting ? fy : input.hand.y
    if (raised) {
      // Preserve the contact through cue/manual-hand handoffs. A hidden hand
      // starts directly at its target; a visible hand never teleports.
      const blend = wasHidden ? 1 : 1 - Math.exp(-dt * 30)
      s.lastX += (x - s.lastX) * blend
      s.lastY += (y - s.lastY) * blend
      x = s.lastX; y = s.lastY
    }
    else { x = s.lastX; y = s.lastY }
    // the arm comes from a shoulder below-right of the view
    const sx = W * (side === 'left' ? .2 : .8)
    const sy = H * 1.45
    const want = Math.atan2(-(sx - x), sy - y) * deg - FOREARM_TILT
    const target = Math.max(-30, Math.min(26, want))
    s.rot += (target - s.rot) * (1 - Math.exp(-dt * 10))
    // further reach (higher in view) → the hand is further from the eye → smaller
    const depth = 0.84 + 0.26 * Math.max(0, Math.min(1, y / H))
    const scale = Math.min(1, H / 800) * depth
    if (root.current) {
      root.current.style.opacity = (s.rise * (ghost ? 0.85 : 1)).toFixed(3)
      root.current.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + (reduce ? 0 : (1 - s.rise) * 160)).toFixed(1)}px, 0) rotate(${s.rot.toFixed(2)}deg) scale(${scale.toFixed(3)}) scaleX(${side === 'left' ? -1 : 1})`
    }
    if (root.current) { root.current.dataset.pose = closed ? 'pinch' : 'open'; root.current.dataset.gesture = acting ? feedback.mode : 'reach' }
    // keep the active contact point on the input point: open → index tip, closed → where finger meets thumb
    const tx = TIP_OPEN.x + (TIP_PINCH.x - TIP_OPEN.x) * s.pinch
    const ty = TIP_OPEN.y + (TIP_PINCH.y - TIP_OPEN.y) * s.pinch
    if (rig.current) rig.current.style.transform = `translate3d(${(-tx).toFixed(2)}px, ${(-ty).toFixed(2)}px, 0)`
    if (open.current) open.current.style.opacity = (1 - s.pinch).toFixed(3)
    if (pinch.current) pinch.current.style.opacity = s.pinch.toFixed(3)
    if (cue.current) cue.current.style.transform = `scale(${closed ? 0.7 : 1})`
  })

  preload(`/assets/realism/hand-${tone}.webp`, { as: 'image' })
  const bg = { backgroundImage: `url('/assets/realism/hand-${tone}.webp')`, backgroundSize: `${CELL.w * 2}px ${CELL.h}px`, width: CELL.w, height: CELL.h * .82 }
  return (
    <div ref={root} className="natural-hand" data-hand-side={side} data-ghost={ghost} aria-hidden="true">
      <div ref={rig} className="hand-rig">
        <div ref={open} className="hand-pose" style={{ ...bg, backgroundPosition: 'left top' }} />
        <div ref={pinch} className="hand-pose" style={{ ...bg, backgroundPosition: 'right top', opacity: 0 }} />
      </div>
      {teaching && !ghost && <div ref={cue} className="hand-tip" />}
    </div>
  )
}
