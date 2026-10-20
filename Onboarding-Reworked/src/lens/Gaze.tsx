import { useRef } from 'react'
import { useFrame } from '../engine/hooks'
import { input } from '../engine/input'
import { getAttendedInfo } from '../engine/targets'

const R = 17
const C = 2 * Math.PI * R

/**
 * The gaze aperture. At rest it is a barely-there point of light. On things
 * that need held attention it opens into a ring that closes as attention
 * settles — the lens stopping down onto what you're looking at.
 */
export function Gaze() {
  const root = useRef<HTMLDivElement>(null)
  const ring = useRef<SVGCircleElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const s = useRef({ open: 0, prog: 0, dim: 0, settled: 0 })

  useFrame((dt) => {
    const el = root.current
    if (!el || !ring.current || !dot.current) return
    const info = getAttendedInfo()
    const st = s.current
    const a = 1 - Math.exp(-dt * 12)
    const wantOpen = info?.iris ? 1 : 0
    const wantDim = info && !info.iris ? 1 : input.handRaised ? 0.6 : 0
    st.open += (wantOpen - st.open) * a
    st.dim += (wantDim - st.dim) * a
    st.prog += ((info?.iris ? Math.min(1, info.progress) : 0) - st.prog) * (1 - Math.exp(-dt * 20))
    st.settled += ((info?.iris && info.settled ? 1 : 0) - st.settled) * (1 - Math.exp(-dt * 9))

    el.style.transform = `translate3d(${input.gaze.x.toFixed(1)}px, ${input.gaze.y.toFixed(1)}px, 0)`
    ring.current.style.strokeDashoffset = (C * (1 - st.prog)).toFixed(2)
    ring.current.parentElement!.parentElement!.style.opacity = st.open.toFixed(3)
    const sc = 0.7 + st.open * 0.3 - st.settled * 0.12
    ring.current.parentElement!.parentElement!.style.transform = `translate(-50%,-50%) scale(${sc.toFixed(3)})`
    dot.current.style.opacity = (0.95 - st.open * 0.15).toFixed(3)
    dot.current.style.transform = `translate(-50%,-50%) scale(${(1 + st.settled * 0.5).toFixed(3)})`
  })

  return (
    <div ref={root} className="gaze" style={{ position: 'fixed', left: 0, top: 0, pointerEvents: 'none', zIndex: 100 }}>
      <div
        ref={dot}
        style={{
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #fff 0%, #ecf7f8 45%, #a4cbd0 100%)',
          boxShadow: '0 0 0 2px rgba(15,20,24,.8), 0 0 0 3px rgba(255,255,255,.8), 0 2px 8px rgba(0,0,0,.45)',
          transform: 'translate(-50%,-50%)',
        }}
      />
      <div style={{ position: 'absolute', opacity: 0, transform: 'translate(-50%,-50%)' }}>
        <svg width="48" height="48" viewBox="0 0 48 48" style={{ display: 'block', overflow: 'visible' }}>
          <circle cx="24" cy="24" r={R} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.5" />
          <circle
            ref={ring}
            cx="24"
            cy="24"
            r={R}
            fill="none"
            stroke="#ecfcff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C}
            transform="rotate(-90 24 24)"
            style={{ filter: 'drop-shadow(0 0 4px rgba(255,236,200,.8))' }}
          />
        </svg>
      </div>
    </div>
  )
}
