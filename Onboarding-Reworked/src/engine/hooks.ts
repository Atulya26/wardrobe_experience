import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { on, input } from './input'
import { registerTarget, updateTargetOpts, type TargetOpts } from './targets'
import { useLens } from '../state/store'

/** Register an element as attendable. Options can change every render. */
export function useTarget<T extends HTMLElement>(id: string, opts: TargetOpts) {
  const ref = useRef<T>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts
  useLayoutEffect(() => {
    if (!ref.current) return
    return registerTarget(id, ref.current, optsRef.current)
  }, [id])
  useEffect(() => {
    updateTargetOpts(id, opts)
  })
  return ref
}

export function useFrame(fn: (dt: number, t: number) => void, phase: 'view' | 'anchor' | 'frame' = 'frame') {
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => on(phase, ({ dt, t }) => fnRef.current(dt, t)), [phase])
}

export function useAttended(id: string) {
  return useLens((s) => s.attended === id)
}
export function useSettled(id: string) {
  return useLens((s) => s.attended === id && s.settled)
}
export function useHandNear(id: string) {
  return useLens((s) => s.handFocus === id)
}

// ——— Anchors: points in the 3D world the lens overlay attaches to ———
const anchors = new Map<string, HTMLElement>()
export function useAnchor<T extends HTMLElement>(name: string) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.dataset.worldAnchor = name
    anchors.set(name, el)
    return () => {
      if (anchors.get(name) === el) anchors.delete(name)
    }
  }, [name])
  return ref
}
const anchorRects = new Map<string, { time: number; el: HTMLElement; rect: DOMRect }>()
export function getAnchorRect(name: string) {
  const el = anchors.get(name)
  if (!el) return null
  const cached = anchorRects.get(name)
  if (cached?.time === input.t && cached.el === el) return cached.rect
  const rect = el.getBoundingClientRect()
  anchorRects.set(name, { time: input.t, el, rect })
  return rect
}

/** Run an effect when an input event fires, scoped to component lifetime. */
export function useInput<K extends Parameters<typeof on>[0]>(type: K, fn: Parameters<typeof on<K>>[1], active = true) {
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    if (!active) return
    return on(type, ((e: never) => (fnRef.current as (e: never) => void)(e)) as never)
  }, [type, active])
}

const compactHeight = window.matchMedia('(max-height: 799px)')
const subscribeHeight = (notify: () => void) => {
  compactHeight.addEventListener('change', notify)
  return () => compactHeight.removeEventListener('change', notify)
}
/** Keep lesson spacing correct after a browser resize as well as initial load. */
export function useCompactHeight() {
  return useSyncExternalStore(subscribeHeight, () => compactHeight.matches)
}
