import { panoramaMode } from '../../world/camera'
import { input } from '../../engine/input'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLens } from '../../state/store'
import { useTarget, useFrame, getAnchorRect } from '../../engine/hooks'
import { sound, unlockAudio, PLACES } from '../../engine/sound'
import { GlassBead, ConnectRing } from '../../lens/GlassBead'
import { Anchored, EdgeCue } from '../../lens/Anchored'
import { Guide, spring, Check } from '../../lens/ui'
import { setMesh, useAfter, useTargetEvents } from './common'

// ——— 1 · Welcome ———
export function Welcome({ ready = true }: { ready?: boolean }) {
  const next = useLens((s) => s.next)
  const ref = useTarget<HTMLDivElement>('begin', {
    enabled: ready,
    priority: 2,
    iris: true,
    dwellMs: 420,
    pad: 34,
    onSelect: () => {
      unlockAudio()
      sound.bloom()
      next()
    },
  })
  return (
    <>
      <motion.div
        className="layer"
        style={{ display: 'grid', placeItems: 'center', zIndex: 30 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: .35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="welcome-content">
          <div className="welcome-copy">
          <motion.div
            className="display"
            style={{ marginTop: 0 }}
            initial={{ opacity: 0, transform: 'translate3d(0,12px,0)' }}
            animate={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
            transition={{ delay: .1, duration: .35, ease: [0.22, 1, 0.36, 1] }}
          >
            Good morning.
          </motion.div>
          <motion.div className="body" style={{ marginTop: 16 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2, duration: .35 }}>
            A companion that lives in what you see.
          </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .25, ...spring }} style={{ marginTop: 36, display: 'grid', placeItems: 'center' }}>
            <div ref={ref} className="bead"><GlassBead /></div>
          </motion.div>
        </div>
      </motion.div>
      <Guide id="welcome" line={ready ? "Look at the light, then click to begin." : "Preparing your room…"} hint={<>Mouse = eyes · click = hand pinch · voice is optional</>} />
    </>
  )
}

// ——— 2 · Environment awareness ———
const SURFACES = [
  { id: 'window', label: 'Window' },
  { id: 'dresser', label: panoramaMode ? 'Console' : 'Dresser' },
  { id: 'wardrobe', label: panoramaMode ? 'Sofa' : 'Wardrobe' },
  { id: 'mirror', label: 'Mirror' },
]

export function Environment() {
  const next = useLens((s) => s.next)
  const [found, setFound] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const start = useRef(performance.now())
  const scanHold = useRef<Record<string, number>>({})
  const [cue, setCue] = useState(false)
  useAfter(5000, () => setCue(true))

  useEffect(() => {
    sound.scan()
    setMesh(1, 1400)
    const t = window.setTimeout(() => setMesh(0.5, 1200), 1500)
    return () => {
      window.clearTimeout(t)
      setMesh(0, 700)
    }
  }, [])

  useFrame((dt) => {
    if (done || performance.now() - start.current < 1300) return
    const W = window.innerWidth
    const H = window.innerHeight
    for (const s of SURFACES) {
      if (found.includes(s.id)) continue
      const r = getAnchorRect(s.id)
      if (!r) continue
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      const visible = Math.abs(x - W / 2) < W * 0.3 && y > H * 0.05 && y < H * 0.95
      const looking = Math.abs(input.gaze.x - x) < W * .15 && Math.abs(input.gaze.y - y) < H * .2
      scanHold.current[s.id] = looking ? (scanHold.current[s.id] ?? 0) + dt : 0
      if (panoramaMode ? scanHold.current[s.id] > .45 : visible) {
        sound.tick(PLACES[s.id as keyof typeof PLACES])
        const nf = [...found, s.id]
        setFound(nf)
        if (nf.length === SURFACES.length) {
          setDone(true)
          setMesh(0, 1600)
          sound.success()
        }
        break
      }
    }
  })
  useAfter(2600, next, done)

  const missing = SURFACES.filter((s) => !found.includes(s.id)).map((s) => s.id)
  return (
    <>
      <Anchored to="floor">
        <SurfaceTag label="Floor" done={done} />
      </Anchored>
      {found.map((id) => (
        <Anchored key={id} to={id}>
          <SurfaceTag label={SURFACES.find((s) => s.id === id)!.label} done={done} />
        </Anchored>
      ))}
      {!done && missing.slice(0, 1).map((id) => <EdgeCue key={id} to={id} active={cue} />)}
      <Guide
        id={done ? 'env-done' : 'env'}
        line={done ? 'Your room is mapped.' : 'Your companion is getting to know your room.'}
        hint={done ? 'It will remember where things are.' : <>Look around slowly — left, then right · {found.length} of {SURFACES.length} recognised</>}
      />
    </>
  )
}

function SurfaceTag({ label, done }: { label: string; done: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 6 }}
      animate={{ opacity: done ? 0.0 : 1, scale: 1, y: 0 }}
      transition={done ? { duration: 1.2, delay: 1 } : spring}
      className="glass"
      style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 14px 0 10px', borderRadius: 999, fontSize: 13, fontWeight: 590 }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--lens)', boxShadow: '0 0 8px var(--lens-glow)' }} />
      {label}
    </motion.div>
  )
}

// ——— 3 · Attention, carried into 4 · Find the phone ———
export function Bead() {
  const stage = useLens((s) => s.stage)
  const next = useLens((s) => s.next)
  const [bloomed, setBloomed] = useState(false)
  const ref = useTarget<HTMLDivElement>('bead', {
    enabled: stage === 3 && !bloomed,
    iris: true,
    focusField: true,
    depth: 1250,
    dwellMs: 1200,
    pad: 30,
    priority: 2,
    onSettle: () => {
      setBloomed(true)
      sound.bloom()
    },
  })
  useAfter(2400, next, stage === 3 && bloomed)
  const leading = stage === 4
  return (
    <Anchored to={leading ? 'phone' : 'front'} dy={leading ? -46 : 0} smooth={1.6}>
      <motion.div initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.4 }} transition={{ duration: 0.9 }}>
        <div ref={ref} className={`bead${bloomed && stage === 3 ? ' bloom' : ''}${leading ? ' small' : ''}`}><GlassBead /></div>
      </motion.div>
    </Anchored>
  )
}

export function Attention() {
  const settled = useLens((s) => s.attended === 'bead' && s.settled)
  const [seen, setSeen] = useState(false)
  useTargetEvents((e) => e.id === 'bead' && e.type === 'settle' && setSeen(true))
  return (
    <Guide
      id={seen || settled ? 'att-done' : 'att'}
      line={seen ? 'It noticed you.' : 'This is attention. Rest your eyes on the light.'}
      hint={seen ? 'Looking is how you set your attention.' : 'Look away early and it lets go'}
    />
  )
}

export function FindPhone() {
  const next = useLens((s) => s.next)
  useTargetEvents((e) => {
    if (e.id === 'phone' && e.type === 'settle') next()
  })
  return (
    <>
      <EdgeCue to="phone" />
      <Guide id="phone" line="Your phone is close by. Find it with your eyes." hint={panoramaMode ? "It’s on the console to your left · hold your gaze on it" : "It’s on the dresser to your left · hold your gaze on it"} />
    </>
  )
}

// ——— 5 · Pairing → 6 · Pairing success ———
export function PairCard() {
  const stage = useLens((s) => s.stage)
  const next = useLens((s) => s.next)
  const paired = stage >= 6
  useEffect(() => {
    if (paired) sound.success(PLACES.phone)
    else sound.hum(true, PLACES.phone)
  }, [paired])
  useAfter(3000, next, stage === 5)
  useAfter(2600, next, stage === 6)

  return (
    <Anchored to="phone" dy={-34} origin="bottom">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, scale: 0.96, filter: 'blur(8px)' }}
        transition={spring}
        style={{ display: 'grid', justifyItems: 'center' }}
      >
        <motion.div layout className="glass" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px 16px 16px', borderRadius: 26 }}>
          <div style={{ width: 48, height: 48, display: 'grid', placeItems: 'center' }}>
            <AnimatePresence mode="wait">
              {paired ? (
                <motion.div key="ok" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}>
                  <Check size={44} />
                </motion.div>
              ) : (
                <motion.div key="pairing" exit={{ scale: 0.5, opacity: 0 }}>
                  <PairGlyph />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <AnimatePresence mode="wait">
              <motion.div key={paired ? 'p' : 'c'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3 }}>
                <div style={{ fontSize: 17, fontWeight: 650, letterSpacing: '-0.015em' }}>{paired ? 'Phone connected' : 'Connecting to your phone'}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>{paired ? 'Ready for gaze setup' : 'Pairing your devices'}</div><div style={{ fontSize: 10, color: 'var(--ink-2)', marginTop: 8, letterSpacing: '.04em' }}>SIMULATED PAIRING</div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
        {/* a thread of light from the phone up to its lens surface */}
        <div style={{ width: 1.5, height: 42, background: `linear-gradient(180deg, ${paired ? 'var(--ok)' : 'var(--lens)'}, transparent)`, opacity: 0.8 }} />

      </motion.div>
    </Anchored>
  )
}

function PairGlyph() {
  return <ConnectRing size={40} />
}
