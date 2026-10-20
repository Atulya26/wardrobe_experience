import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLens } from '../../state/store'
import { useTarget, useFrame, useInput, useCompactHeight } from '../../engine/hooks'
import { sound } from '../../engine/sound'
import { clamp } from '../../engine/input'
import { Anchored } from '../../lens/Anchored'
import { Guide, Kbd } from '../../lens/ui'
import { FabricFace, FABRICS, type Fabric } from './Swatch'
import { useAfter } from './common'

/**
 * 18 · Pinch-zoom and 19 · Swipe, on the swatch the wearer chose.
 * Zoom is meaningful: past ~2× the weave itself resolves, thread by thread.
 */
export function Detail({ fabric }: { fabric: Fabric }) {
  const compact = useCompactHeight()
  const stage = useLens((s) => s.stage)
  const next = useLens((s) => s.next)
  const reduce = useLens((s) => s.reduceMotion)
  const meta = FABRICS.find((f) => f.id === fabric)!

  const body = useRef<HTMLDivElement>(null)
  const weave = useRef<HTMLDivElement>(null)
  const info = useRef<HTMLDivElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const st = useRef({ z: 1, zt: 1, lastZoom: 0, peak: 1, x: 0, xt: 0, dragging: false, gone: 0 as 0 | 1 | -1 })
  const [zoomed, setZoomed] = useState(false)
  const [gone, setGone] = useState(false)

  const fly = (dir: 1 | -1) => {
    const s = st.current
    if (s.gone || stage !== 19) return
    s.gone = dir
    s.xt = dir * window.innerWidth * 0.9
    sound.swipe(dir)
    setGone(true)
  }

  const ref = useTarget<HTMLDivElement>('swatch-detail', {
    priority: 2,
    pad: 20,
    focusField: true,
    depth: 1250,
    enabled: !gone,
    quiet: true,
    grab:
      stage === 19
        ? {
            onCancel: () => { st.current.dragging = false; st.current.xt = 0 },
            onGrab: () => (st.current.dragging = true),
            onDrag: (dx) => (st.current.x += dx),
            onRelease: () => {
              const s = st.current
              s.dragging = false
              if (s.gone) return
              if (Math.abs(s.x) > 150) fly(s.x > 0 ? 1 : -1)
              else s.xt = 0
            },
          }
        : undefined,
  })

  useInput('zoom', ({ delta }) => {
    if (stage !== 18 && stage !== 19) return
    const s = st.current
    s.zt = clamp(s.zt * Math.exp(delta), 0.8, 4.2)
    s.lastZoom = performance.now()
    s.peak = Math.max(s.peak, s.zt)
  })
  useInput('swipe', ({ dir }) => fly(dir))

  // when the swipe lesson begins, ease back to a comfortable size
  useEffect(() => {
    if (stage === 19) st.current.zt = Math.min(st.current.zt, 1.5)
  }, [stage])

  useFrame((dt) => {
    const s = st.current
    const k = 1 - Math.exp(-dt * (reduce ? 30 : 12))
    s.z += (s.zt - s.z) * k
    if (!s.dragging) s.x += (s.xt - s.x) * (1 - Math.exp(-dt * (s.gone ? 5 : 14)))
    const rot = s.x * 0.03
    if (body.current) {
      body.current.style.transform = `translateX(${s.x.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${(s.z * Math.min(1, window.innerHeight / 850)).toFixed(3)})`
      body.current.style.opacity = s.gone ? String(clamp(1 - Math.abs(s.x) / (window.innerWidth * 0.7), 0, 1)) : '1'
    }
    const w = clamp((s.z - 1.5) / 1, 0, 1)
    if (weave.current) weave.current.style.opacity = w.toFixed(3)
    if (info.current) {
      info.current.style.opacity = (stage === 18 ? clamp((s.z - 1.8) / 0.6, 0, 1) : 0).toFixed(3)
      // Position from the displayed fabric, not its unscaled layout box.
      const r = body.current?.getBoundingClientRect()
      if (r) {
        const width = Math.min(220, window.innerWidth - 40)
        const right = r.right + 24
        const left = r.left - width - 24
        const fitsRight = right + width < window.innerWidth - 20
        const fitsLeft = left > 20
        const x = fitsRight ? right : fitsLeft ? left : window.innerWidth - width - 20
        const y = fitsRight || fitsLeft ? clamp(r.top + r.height / 2 - 48, 105, window.innerHeight - 220) : 105
        info.current.style.width = `${width}px`
        info.current.style.transform = `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0)`
      }
    }
    if (readout.current) readout.current.textContent = `${s.z.toFixed(1)}×`
    if (stage === 18 && !zoomed && s.zt >= 2.6 && performance.now() - s.lastZoom > 650) {
      setZoomed(true)
      sound.settle()
    }
  })

  useAfter(1400, next, stage === 18 && zoomed)
  useAfter(1100, next, stage === 19 && gone)

  return (
    <>
      <Anchored to="front" dy={compact ? -65 : -20}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 20 }} style={{ position: 'relative' }}>
          <div ref={ref} style={{ width: 150, height: 190, position: 'relative' }} className="swatch">
            <div ref={body} className="sw-body" style={{ transformOrigin: '50% 50%', willChange: 'transform' }}>
              <FabricFace fabric={fabric} />
              <div ref={weave} style={{ position: 'absolute', inset: 0, opacity: 0 }}>
                <Weave fabric={fabric} />
              </div>
              <div className="sw-sheen" />
            </div>
          </div>
          <div className="eyebrow shadowed zoom-readout" style={{ position: 'absolute', left: '50%', top: '100%', transform: 'translate(-50%, 0)', marginTop: 18, opacity: stage === 18 ? 1 : 0, transition: 'opacity .4s' }}>
            <span ref={readout}>1.0×</span>
          </div>
        </motion.div>
      </Anchored>
          <div ref={info} style={{ position: 'fixed', left: 0, top: 0, zIndex: 46, opacity: 0, width: 220, pointerEvents: 'none' }}>
            <div className="glass fabric-detail" style={{ padding: '16px 18px', borderRadius: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 650 }}>{meta.name}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.4 }}>{meta.detail}</div>
            </div>
          </div>

      {stage === 18 && (
        <Guide
          inputMode="zoom"
          id={zoomed ? 'z-done' : 'z'}
          line={zoomed ? 'Close enough to see the weave.' : 'Pinch your hands apart to bring it closer.'}
          hint={
            zoomed ? (
              'Pinch inward to send it back.'
            ) : (
              <>
                Simulate it: trackpad pinch, scroll, or <Kbd>+</Kbd> <Kbd>−</Kbd>
              </>
            )
          }
        />
      )}
      {stage === 19 && (
        <Guide
          inputMode="swipe"
          id={gone ? 'w-done' : 'w'}
          line={gone ? 'Swiped away by your hand.' : 'Use your hand to swipe it away.'}
          hint={
            gone ? undefined : (
              <>
                Click and drag the sample sideways · or <Kbd>←</Kbd> <Kbd>→</Kbd>
              </>
            )
          }
        />
      )}
    </>
  )
}

// Keep the photographic fibers continuous as the sample magnifies.
function Weave({ fabric }: { fabric: Fabric }) {
  return <FabricFace fabric={fabric} />
}
