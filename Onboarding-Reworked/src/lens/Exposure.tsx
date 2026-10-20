import { useRef } from 'react'
import { getAnchorRect, useFrame } from '../engine/hooks'
import { useLens } from '../state/store'

/**
 * Eye adaptation. A bright window in view pulls exposure down (the room dims a
 * little); look away and the room recovers over ~1.5 s while the window, now
 * outside what the eye is adapted for, blooms softly at the edge of vision.
 */
export function Exposure() {
  const dim = useRef<HTMLDivElement>(null)
  const bloom = useRef<HTMLDivElement>(null)
  const st = useRef({ ev: 0, last: '' })
  const reduce = useLens((s) => s.reduceMotion)

  useFrame((dt) => {
    const r = getAnchorRect('window-pane')
    const W = window.innerWidth
    const H = window.innerHeight
    let frac = 0
    let cx = 0
    let cy = 0
    let size = 0
    if (r && W > 0 && H > 0) {
      const ix = Math.max(0, Math.min(r.right, W) - Math.max(r.left, 0))
      const iy = Math.max(0, Math.min(r.bottom, H) - Math.max(r.top, 0))
      frac = (ix * iy) / (W * H)
      cx = r.left + r.width / 2
      cy = r.top + r.height / 2
      size = Math.hypot(Math.min(r.width, W), Math.min(r.height, H))
    }
    // how strongly the bright window dominates the view, 0..1
    const target = Math.min(1, frac * 3.2)
    const s = st.current
    const rate = target > s.ev ? 1.1 : 0.7 // stopping down is quicker than opening up
    s.ev += (target - s.ev) * (1 - Math.exp(-dt * (reduce ? 4 : rate)))
    if (dim.current) dim.current.style.opacity = (0.04 + s.ev * 0.2).toFixed(3)
    if (bloom.current) {
      const b = frac > 0 ? Math.min(1, frac * 9) * (1 - s.ev) * 0.55 : 0
      const key = `${b.toFixed(3)}|${cx.toFixed(0)}|${cy.toFixed(0)}|${size.toFixed(0)}`
      if (key !== s.last) {
        s.last = key
        bloom.current.style.opacity = b.toFixed(3)
        bloom.current.style.width = bloom.current.style.height = `${(size * 1.25).toFixed(0)}px`
        bloom.current.style.transform = `translate3d(${(cx - size * 0.625).toFixed(0)}px, ${(cy - size * 0.625).toFixed(0)}px, 0)`
      }
    }
  })

  // Two separate fixed elements: wrapping them would isolate the bloom's blend from the room.
  return (
    <>
      <div ref={dim} className="layer" aria-hidden="true" style={{ zIndex: 2, background: 'rgb(18,14,10)', opacity: 0.04 }} />
      <div
        ref={bloom}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 2,
          pointerEvents: 'none',
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(255,248,232,.85), rgba(255,244,222,.35) 45%, transparent 75%)',
          mixBlendMode: 'screen',
          opacity: 0,
        }}
      />
    </>
  )
}
