import { useEffect, useRef } from 'react'
import { useLens } from '../../state/store'
import { onTargetEvent, type TargetEvent } from '../../engine/targets'

export function useAfter(ms: number, fn: () => void, when = true) {
  const f = useRef(fn)
  f.current = fn
  useEffect(() => {
    if (!when) return
    const stage = useLens.getState().stage
    const t = window.setTimeout(() => { if (useLens.getState().stage === stage) f.current() }, ms)
    return () => window.clearTimeout(t)
  }, [ms, when])
}

export function useTargetEvents(fn: (e: TargetEvent) => void) {
  const f = useRef(fn)
  f.current = fn
  useEffect(() => onTargetEvent((e) => f.current(e)), [])
}

let meshValue = 0
let meshTween = 0
/** Reveal or hide the room's spatial mesh. */
export function setMesh(v: number, ms = 900) {
  cancelAnimationFrame(meshTween)
  const from = meshValue
  const t0 = performance.now()
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / ms)
    const e = 1 - Math.pow(1 - k, 3)
    meshValue = from + (v - from) * e
    document.documentElement.style.setProperty('--mesh', meshValue.toFixed(3))
    if (k < 1) meshTween = requestAnimationFrame(step)
  }
  meshTween = requestAnimationFrame(step)
}
