import { useRef, type CSSProperties, type ReactNode } from 'react'
import { getAnchorRect, useFrame } from '../engine/hooks'

/**
 * Lens content that belongs to something in the world. It rides on the
 * anchor's projected position every frame, so it survives looking away and back.
 */
export function Anchored({
  to,
  dx = 0,
  dy = 0,
  children,
  style,
  origin = 'center',
  smooth = 0,
}: {
  to: string
  dx?: number
  dy?: number
  children: ReactNode
  style?: CSSProperties
  origin?: 'center' | 'bottom' | 'top' | 'left' | 'right'
  /** >0: glide toward the anchor instead of snapping (rate per second) */
  smooth?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const glide = useRef({ to, dx, dy, ox: 0, oy: 0, x: NaN, y: NaN })
  useFrame((dt) => {
    const el = ref.current
    const r = getAnchorRect(to)
    if (!el || !r) return
    let x = r.left + r.width / 2 + dx
    let y = r.top + r.height / 2 + dy
    if (smooth > 0) {
      // glide as an offset that decays, so the item stays world-locked while it travels
      const g = glide.current
      if ((g.to !== to || g.dx !== dx || g.dy !== dy) && !isNaN(g.x)) {
        g.ox = g.x - x
        g.oy = g.y - y
      }
      g.to = to
      g.dx = dx
      g.dy = dy
      const k = Math.exp(-dt * smooth)
      g.ox *= k
      g.oy *= k
      x += g.ox
      y += g.oy
      g.x = x
      g.y = y
    }
    // Keep readable cards inside the viewport while their source anchor stays mapped.
    const content = el.firstElementChild as HTMLElement | null
    if (content && content.offsetWidth > 180) {
      const w=content.offsetWidth,h=content.offsetHeight,margin=24
      if (origin==='center' || origin==='bottom' || origin==='top') x=Math.max(margin+w/2,Math.min(innerWidth-margin-w/2,x))
      const above=origin==='bottom'?h:origin==='top'?0:h/2
      const below=origin==='top'?h:origin==='bottom'?0:h/2
      y=Math.max(margin+above,Math.min(innerHeight-margin-below,y))
    }
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
  }, 'anchor')
  const t =
    origin === 'bottom'
      ? 'translate(-50%, -100%)'
      : origin === 'top'
        ? 'translate(-50%, 0)'
        : origin === 'left'
          ? 'translate(0, -50%)'
          : origin === 'right'
            ? 'translate(-100%, -50%)'
            : 'translate(-50%, -50%)'
  return (
    <div ref={ref} style={{ position: 'fixed', left: 0, top: 0, willChange: 'transform', ...style }}>
      <div style={{ transform: t }}>{children}</div>
    </div>
  )
}

/**
 * A peripheral cue: when an anchor is out of view, a warm light gathers at the
 * edge of the field of view nearest to it. No arrows — just where light comes from.
 */
export function EdgeCue({ to, active = true }: { to: string; active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const op = useRef(0)
  useFrame((dt) => {
    const el = ref.current
    const r = getAnchorRect(to)
    if (!el) return
    let target = 0
    let x = 0
    let y = 0
    if (r && active) {
      const W = window.innerWidth
      const H = window.innerHeight
      const ax = r.left + r.width / 2
      const ay = r.top + r.height / 2
      const m = 70
      const off = ax < m || ax > W - m || ay < m || ay > H - m
      target = off ? 1 : 0
      x = Math.max(0, Math.min(W, ax))
      y = Math.max(0, Math.min(H, ay))
    }
    op.current += (target - op.current) * (1 - Math.exp(-dt * 5))
    el.style.opacity = op.current.toFixed(3)
    if (r) el.style.transform = `translate3d(${x - 260}px, ${y - 260}px, 0)`
  })
  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 520,
        height: 520,
        borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(255,240,214,.55), rgba(255,240,214,.18) 45%, transparent)',
        mixBlendMode: 'screen',
        opacity: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
