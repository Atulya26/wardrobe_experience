import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLens } from '../../state/store'
import { useTarget, useFrame, useInput } from '../../engine/hooks'
import { input, lockHead, unlockHead } from '../../engine/input'
import { sound } from '../../engine/sound'
import { Anchored } from '../../lens/Anchored'
import { Guide, Moment, Ornament, Check, depthIn, spring, Kbd } from '../../lens/ui'
import { SkillIcon } from '../../lens/SkillIcon'
import { useAfter } from './common'

// The five points, in the brief's exact order: centre, left, right, up, down.
const POINTS = [
  { name: 'Centre', x: 0.5, y: 0.5 },
  { name: 'Left', x: 0.14, y: 0.5 },
  { name: 'Right', x: 0.86, y: 0.5 },
  { name: 'Up', x: 0.5, y: 0.15 },
  { name: 'Down', x: 0.5, y: 0.85 },
]

/** Held across 8–10: the view keeps still so only the eyes move. */
export function HeadStill() {
  useEffect(() => {
    lockHead('calibration')
    return () => unlockHead('calibration')
  }, [])
  return (
    <motion.div
      className="layer"
      style={{ background: 'radial-gradient(120% 100% at 50% 50%, rgba(12,10,8,.38), rgba(12,10,8,.62))', zIndex: 20 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
    />
  )
}

// ——— 7 · Introduction ———
export function CalIntro() {
  const next = useLens((s) => s.next)
  return (
    <Anchored to="front" dy={-40}>
      <motion.div {...depthIn} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="glass calibration-intro" style={{ width: 360, padding: '28px', textAlign: 'left' }}>
        <div className="setup-symbol" aria-hidden="true"><SkillIcon name="Look" size={32} /></div>
        <div className="title" style={{ marginTop: 10 }}>
          Set up your gaze
        </div>
        <div className="body" style={{ marginTop: 10 }}>
          Follow five points of light, one at a time. Hold your gaze until each settles. Your view stays still.
        </div>
        <div className="calibration-footer">
          <svg width="92" height="70" viewBox="0 0 92 70" aria-label="Order: centre, left, right, up, down">
            {POINTS.map((p, i) => (
              <g key={i}>
                <circle cx={6 + p.x * 80} cy={4 + p.y * 62} r={i === 0 ? 4.5 : 3.5} fill={i === 0 ? '#fff' : 'rgba(255,255,255,.45)'} />
                <text x={6 + p.x * 80 + 7} y={4 + p.y * 62 + 3.5} fontSize="8" fill="rgba(255,255,255,.5)" fontFamily="SF Mono, monospace">
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
          <Ornament id="cal-start" primary onSelect={next}>
            Start
          </Ornament>
        </div>
      </motion.div>
    </Anchored>
  )
}

// ——— 8 · Five-point calibration ———
export function FivePoints() {
  const next = useLens((s) => s.next)
  const [i, setI] = useState(0)
  const [done, setDone] = useState<number[]>([])
  useAfter(700, next, i >= POINTS.length)

  return (
    <>
      <div className="layer" style={{ zIndex: 35 }}>
        {done.map((d) => (
          <motion.div
            key={d}
            initial={{ scale: 2.2, opacity: 1 }}
            animate={{ scale: 1, opacity: 0.45 }}
            transition={{ duration: 0.6 }}
            style={{ position: 'fixed', left: `${POINTS[d].x * 100}%`, top: `${POINTS[d].y * 100}%`, width: 6, height: 6, margin: -3, borderRadius: '50%', background: '#fff' }}
          />
        ))}
        <AnimatePresence>
          {i < POINTS.length && (
            <CalPoint
              key={i}
              index={i}
              onDone={() => {
                sound.tick()
                setDone((d) => [...d, i])
                window.setTimeout(() => setI((n) => n + 1), 380)
              }}
            />
          )}
        </AnimatePresence>
      </div>
      <Guide
        id="cal"
        line="Follow the light with your eyes."
        hint={i < POINTS.length ? `${POINTS[i].name} · ${i + 1} of 5 · your view is holding still` : 'Good.'}
      />
    </>
  )
}

function CalPoint({ index, onDone }: { index: number; onDone: () => void }) {
  const [settled, setSettled] = useState(false)
  const ref = useTarget<HTMLDivElement>(`cal-${index}`, {
    iris: true,
    dwellMs: 950,
    pad: 40,
    priority: 3,
    enabled: !settled,
    onSettle: () => {
      setSettled(true)
      onDone()
    },
  })
  const p = POINTS[index]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: settled ? 0.4 : 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={spring}
      style={{ position: 'fixed', left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: 0, height: 0 }}
    >
      <div ref={ref} className="calpt" style={{ position: 'absolute', left: -9, top: -9 }} />
    </motion.div>
  )
}

// ——— 9 · Range sweep ———
// The point traces a figure-of-eight through the edges of your view. It only
// moves while your eyes are with it — so finishing proves the range, not time.
export function Sweep() {
  const next = useLens((s) => s.next)
  const dot = useRef<HTMLDivElement>(null)
  const trail = useRef<SVGPolylineElement>(null)
  const st = useRef({ th: 0, pts: [] as string[], tracking: false, lost: 0, keyHold: false })
  const [lostLong, setLostLong] = useState(false)
  const [tracking, setTracking] = useState(false)
  const [complete, setComplete] = useState(false)

  useInput('pinchstart', ({ source }) => source === 'key' && (st.current.keyHold = true))
  useInput('pinchend', () => (st.current.keyHold = false))

  useFrame((dt) => {
    const s = st.current
    if (complete) return
    const W = window.innerWidth
    const H = window.innerHeight
    const pos = (th: number) => ({ x: W / 2 + Math.sin(th) * W * 0.34, y: H / 2 + Math.sin(th * 2) * H * 0.3 })
    const p = pos(s.th)
    const near = Math.hypot(input.gaze.x - p.x, input.gaze.y - p.y) < 80
    const moving = near || s.keyHold
    if (moving !== s.tracking) {
      s.tracking = moving
      setTracking(moving)
    }
    if (moving) {
      s.lost = 0
      s.th += dt * 1.05
      if (s.pts.length === 0 || s.th * 30 > s.pts.length) s.pts.push(`${p.x.toFixed(0)},${p.y.toFixed(0)}`)
      trail.current?.setAttribute('points', s.pts.join(' '))
    } else {
      s.lost += dt
      if (s.lost > 4 && !lostLong) setLostLong(true)
    }
    if (dot.current) dot.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${moving ? 1 : 1.25 + Math.sin(performance.now() / 260) * 0.12})`
    if (s.th >= Math.PI * 2) {
      setComplete(true)
      sound.success()
    }
  })
  useAfter(900, next, complete)

  return (
    <>
      <div className="layer" style={{ zIndex: 35 }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <polyline ref={trail} fill="none" stroke="rgba(255,244,226,.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(255,236,205,.6))' }} />
        </svg>
        <div ref={dot} style={{ position: 'fixed', left: 0, top: 0, width: 0, height: 0, opacity: complete ? 0 : 1, transition: 'opacity .5s' }}>
          <div className="calpt" style={{ position: 'absolute', left: -9, top: -9, ['--dwell' as string]: tracking ? 0.6 : 0 }} />
        </div>
      </div>
      <Guide
        id={tracking ? 'sw-t' : lostLong ? 'sw-l' : 'sw'}
        line={tracking ? 'Stay with it.' : 'Now follow it as it moves.'}
        hint={lostLong ? <>It waits for you · or hold <Kbd>Enter</Kbd> to move it along</> : 'It only moves while your eyes are on it'}
      />
    </>
  )
}

// ——— 10 · Complete ———
export function EyesReady() {
  const next = useLens((s) => s.next)
  useAfter(2300, next)
  return <Moment show title="Eyes calibrated" sub="Your gaze sets the focus." glyph={<Check />} />
}
