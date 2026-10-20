import { panoramaMode } from '../../world/camera'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLens } from '../../state/store'
import { useFrame } from '../../engine/hooks'
import { input } from '../../engine/input'
import { sound } from '../../engine/sound'
import { Anchored } from '../../lens/Anchored'
import { SkillIcon, type SkillName } from '../../lens/SkillIcon'
import { Guide, Ornament, depthIn, spring } from '../../lens/ui'
import { useAfter } from './common'

const SKILLS: SkillName[] = ['Look', 'Reach', 'Pinch', 'Speak', 'Zoom', 'Swipe']

// ——— 20 · Tutorial complete ———
export function Learned() {
  const next = useLens((s) => s.next)
  const [lit, setLit] = useState(0)
  useEffect(() => {
    const ts = SKILLS.map((_, i) =>
      window.setTimeout(() => {
        setLit(i + 1)
        sound.tick()
      }, 500 + i * 220),
    )
    const t = window.setTimeout(() => sound.success(), 500 + SKILLS.length * 220)
    return () => [...ts, t].forEach(clearTimeout)
  }, [])
  return (
    <Anchored to="front" dy={-30}>
      <motion.div {...depthIn} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="glass completion-card" style={{ width: 540, padding: '32px', textAlign: 'center' }}>
        <div className="eyebrow">Tutorial complete</div>
        <div className="title" style={{ marginTop: 12 }}>
          You're ready.
        </div>
        <div className="completion-skills">
          {SKILLS.map((s, i) => {
            const on = i < lit
            return (
              <motion.div key={s} animate={{ opacity: on ? 1 : 0.28, y: on ? 0 : 4 }} transition={spring} style={{ display: 'grid', justifyItems: 'center', gap: 10, width: '100%' }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    color: on ? '#1a1816' : 'var(--ink)',
                    background: on ? 'rgba(255,252,247,.94)' : 'rgba(255,255,255,.08)',
                    boxShadow: on ? 'inset 0 1px 0 #fff, 0 4px 12px rgba(0,0,0,.12)' : 'inset 0 0 0 1px rgba(255,255,255,.12)',
                    transition: 'background .22s var(--ease-out), color .22s, box-shadow .22s',
                  }}
                >
                  <SkillIcon name={s} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 590, color: 'var(--ink-2)' }}>{s === 'Speak' ? 'Voice' : s}</div>{s === 'Speak' && <span className="skill-optional">Optional</span>}
              </motion.div>
            )
          })}
        </div>
        <div className="body" style={{ marginTop: 26 }}>
          Look to focus. Use your hands to act. Voice is optional.
        </div>
        <div style={{ marginTop: 24 }}>
          <Ornament id="activate" primary onSelect={next} enabled={lit >= SKILLS.length}>
            Meet your companion
          </Ornament>
        </div>
      </motion.div>
    </Anchored>
  )
}

// ——— 21 · Lens activation ———
export function Activation() {
  const [intro, setIntro] = useState(true)
  useEffect(() => {
    sound.bloom()
  }, [])
  useAfter(5200, () => setIntro(false))
  return (
    <>
      <motion.div
        className="layer"
        style={{ display: 'grid', placeItems: 'center', zIndex: 30 }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 2.4, delay: 0.4 }}
      >
        <motion.div
          initial={{ scale: 0.05, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '60vmax', height: '60vmax', borderRadius: '50%', boxShadow: 'inset 0 0 120px 30px rgba(255,240,214,.55), 0 0 80px 10px rgba(255,240,214,.3)' }}
        />
      </motion.div>
      <StatusGlint />
      <AmbientLabels />
      <Guide id={intro ? 'on' : 'off'} line={intro ? 'Your companion is ready.' : undefined} hint="Look around — it stays quiet until you need it." />
    </>
  )
}

/** The only persistent mark of the lens: a point of light that opens when glanced at. */
function StatusGlint() {
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  useFrame(() => {
    const o = input.gaze.y < 90 && Math.abs(input.gaze.x - window.innerWidth / 2) < 180
    if (o !== openRef.current) {
      openRef.current = o
      setOpen(o)
    }
  })
  return (
    <div className="layer" style={{ display: 'flex', justifyContent: 'center', paddingTop: 18, zIndex: 50 }}>
      <motion.div
        layout
        transition={spring}
        className={open ? 'glass' : ''}
        style={{ height: 30, borderRadius: 999, display: 'flex', alignItems: 'center', gap: 9, padding: open ? '0 14px 0 11px' : 0 }}
      >
        <motion.span
          layout
          style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lens)', boxShadow: '0 0 10px 2px var(--lens-glow)' }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3.6, repeat: Infinity }}
        />
        <AnimatePresence>
          {open && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
              Companion · on · phone connected
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

const AMBIENT: Record<string, { anchor: string; title: string; sub: string }> = {
  wardrobe: { anchor: 'wardrobe', title: panoramaMode ? 'Sofa' : 'Wardrobe', sub: panoramaMode ? 'Living room recognised' : 'Wardrobe recognised' },
  mirror: { anchor: 'mirror', title: 'Mirror', sub: 'Mirror recognised' },
  phone: { anchor: 'phone', title: 'Phone', sub: 'Connected' },
}

/** Ambient state: things you look at quietly say what LENS can do with them. */
function AmbientLabels() {
  const attended = useLens((s) => s.attended)
  const settled = useLens((s) => s.settled)
  const item = attended && settled ? AMBIENT[attended] : null
  return (
    <AnimatePresence>
      {item && attended && (
        <Anchored key={attended} to={item.anchor} dy={attended === 'phone' ? -40 : 0} origin="bottom">
          <motion.div {...depthIn} transition={spring} className="glass" style={{ padding: '12px 18px', borderRadius: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 650 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>{item.sub}</div>
          </motion.div>
        </Anchored>
      )}
    </AnimatePresence>
  )
}
