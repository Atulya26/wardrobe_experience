import { clamp, input, on } from './input'
import { getAttendedInfo, getTargetRect } from './targets'
import { useLens } from '../state/store'

/** Visual replay of the existing semantic input. Never generates a selection. */
export const gestureFeedback = {
  mode: 'pinch' as 'pinch' | 'swipe' | 'zoom',
  until: 0, started: 0, closedUntil: 0,
  x: 0, y: 0, dir: 1, spread: 72,
  source: 'pinch', active: false,
}

export function startGestureFeedback() {
  const f = gestureFeedback
  const point = (keyboard = false) => {
    const rect = getAttendedInfo()?.rect ?? getTargetRect('swatch-detail')
    return keyboard && rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { ...input.pointer }
  }
  const off = [
    on('pinchstart', ({ source }) => {
      f.active = false
      if (!getAttendedInfo()) return
      const now = performance.now()
      Object.assign(f, point(source === 'key'), { active: true, mode: 'pinch', source, started: now, until: now + 700, closedUntil: now + 230 })
    }),
    on('pinchend', ({ source }) => {
      if (f.mode !== 'pinch' || !f.active) return
      const now = performance.now()
      // A selection may remove its target before release. Keep the captured
      // keyboard contact instead of falling back to an unrelated pointer.
      Object.assign(f, source === 'key' ? {} : point(), { active: false, until: now + 520, closedUntil: now + 180 })
    }),
    on('swipe', ({ dir, source }) => {
      if (useLens.getState().stage !== 19) return
      const now = performance.now()
      Object.assign(f, point(source === 'key' || source === 'trackpad'), { active: false, mode: 'swipe', source, dir, started: now, until: now + 850, closedUntil: now + 340 })
    }),
    on('zoom', ({ delta }) => {
      if (useLens.getState().stage !== 18) return
      const rect = getTargetRect('swatch-detail')
      if (!rect) return
      const now = performance.now()
      if (f.mode !== 'zoom' || now > f.until) f.spread = 72
      Object.assign(f, { active: false, mode: 'zoom', started: now, until: now + 950, closedUntil: now + 700, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, spread: clamp(f.spread + delta * 55, 55, 155) })
    }),
    on('escape', () => { f.until = 0; f.active = false }),
  ]
  return () => off.forEach(dispose => dispose())
}
