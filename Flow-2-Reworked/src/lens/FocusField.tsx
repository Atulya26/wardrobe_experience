import { useRef } from 'react'
import { useFrame } from '../engine/hooks'
import { getAttendedInfo } from '../engine/targets'

/** Attention gently quiets the periphery without filtering the moving room. */
export function FocusField() {
  const ref = useRef<HTMLDivElement>(null)
  const state = useRef({ opacity: 0, mask: '' })
  useFrame((dt) => {
    const el = ref.current
    if (!el) return
    const info = getAttendedInfo()
    const active = info?.focusField ? info : null
    const s = state.current
    const strength = active ? Math.min(1, 1800 / active.depth) * (.35 + .65 * active.progress) : 0
    s.opacity += (strength - s.opacity) * (1 - Math.exp(-dt * 9))
    el.style.opacity = s.opacity < .002 ? '0' : s.opacity.toFixed(3)
    if (active) {
      const r = active.rect
      const mask = `radial-gradient(${Math.max(160, r.width * 1.2).toFixed(0)}px ${Math.max(160, r.height * 1.2).toFixed(0)}px at ${(r.left + r.width / 2).toFixed(0)}px ${(r.top + r.height / 2).toFixed(0)}px, transparent 45%, #000 100%)`
      if (mask !== s.mask) { el.style.maskImage = mask; s.mask = mask }
    }
  })
  return <div ref={ref} className="layer" aria-hidden="true" style={{ background: 'rgba(32,26,20,.12)', opacity: 0 }} />
}
