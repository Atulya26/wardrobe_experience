import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLens, HAND_TONES, type HandTone } from '../../state/store'
import { useFrame, useTarget } from '../../engine/hooks'
import { input } from '../../engine/input'
import { sound } from '../../engine/sound'
import { Guide, Moment, Kbd, Check } from '../../lens/ui'
import { Hand } from '../../lens/Hand'
import { useAfter } from './common'

const RaiseHint = () => (
  <>
    Hold <Kbd>Space</Kbd> to raise your hand · or press <Kbd>H</Kbd> to keep it up
  </>
)

// ——— 11 · Introduction ———
export function HandIntro() {
  const next = useLens((s) => s.next)
  const raised = useLens((s) => s.handRaised)
  const [ready, setReady] = useState(false)
  // give the line a moment to be read before a raised hand advances
  useAfter(900, () => setReady(true))
  useEffect(() => {
    if (ready && raised) next()
  }, [ready, raised, next])
  return (
    <>
      <Hand ghost />
      <TonePicker />
      <Guide id="hand-intro" line="Your hands can reach into what you see." hint={<RaiseHint />} />
    </>
  )
}

/** A laptop can't see your hand, so let the wearer choose how it is drawn. Optional; never blocks. */
function TonePicker() {
  const tone = useLens((s) => s.handTone)
  const setTone = useLens((s) => s.setHandTone)
  return (
    <div className="layer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '23vh', zIndex: 41 }}>
      <motion.div className="glass tone-picker" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
        <span className="tone-label">Your hand</span>
        {HAND_TONES.map((t) => (
          <ToneChip key={t.id} id={t.id} swatch={t.swatch} label={t.label} active={tone === t.id} onSelect={() => setTone(t.id)} />
        ))}
      </motion.div>
    </div>
  )
}

function ToneChip({ id, swatch, label, active, onSelect }: { id: HandTone; swatch: string; label: string; active: boolean; onSelect: () => void }) {
  const ref = useTarget<HTMLDivElement>(`tone-${id}`, { priority: 2, pad: 6, dwellMs: 180, onSelect })
  return <div ref={ref} className={`tone-chip${active ? ' on' : ''}`} style={{ background: swatch }} role="radio" aria-checked={active} aria-label={label} />
}

// ——— 12 · Detection ———
export function HandDetect() {
  const next = useLens((s) => s.next)
  const raised = useLens((s) => s.handRaised)
  const ring = useRef<SVGCircleElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const prog = useRef(0)
  const [found, setFound] = useState(false)

  useFrame((dt) => {
    if (!found) {
      prog.current = Math.max(0, Math.min(1, prog.current + (input.handRaised ? dt / 1.5 : -dt)))
      if (prog.current >= 1) {
        setFound(true)
        sound.success()
      }
    }
    if (ring.current) ring.current.style.strokeDashoffset = String(440 * (1 - prog.current))
    if (wrap.current) {
      wrap.current.style.transform = `translate3d(${input.hand.x + 30}px, ${input.hand.y + 150}px, 0)`
      wrap.current.style.opacity = input.handRaised ? '1' : '0'
    }
  })
  useAfter(1100, next, found)

  return (
    <>
      <div ref={wrap} style={{ position: 'fixed', left: 0, top: 0, zIndex: 56, transition: 'opacity .4s', pointerEvents: 'none' }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: 'absolute', left: -80, top: -80, overflow: 'visible' }}>
          <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1.5" strokeDasharray="2 6" />
          <circle
            ref={ring}
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke={found ? 'var(--ok)' : 'var(--lens)'}
            strokeWidth="2"
            strokeDasharray="440"
            strokeDashoffset="440"
            transform="rotate(-90 80 80)"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <Guide
        id={found ? 'hd-ok' : raised ? 'hd' : 'hd-lost'}
        line={found ? 'Hand detected.' : raised ? 'Hold it there…' : 'Bring your hand into view.'}
        hint={found ? undefined : raised ? 'Finding your joints' : <RaiseHint />}
      />
    </>
  )
}

// ——— 13 · Tracking active ———
const MOTES = [
  { x: 0.3, y: 0.38 },
  { x: 0.62, y: 0.26 },
  { x: 0.7, y: 0.6 },
]
export function HandTrack() {
  const next = useLens((s) => s.next)
  const raised = useLens((s) => s.handRaised)
  const [lit, setLit] = useState<number[]>([])
  const litRef = useRef<number[]>([])
  useFrame(() => {
    if (!input.handRaised) return
    MOTES.forEach((m, i) => {
      if (litRef.current.includes(i)) return
      const d = Math.hypot(input.hand.x - m.x * window.innerWidth, input.hand.y - m.y * window.innerHeight)
      if (d < 44) {
        litRef.current = [...litRef.current, i]
        setLit(litRef.current)
        sound.tick()
      }
    })
  })
  useAfter(700, next, lit.length === MOTES.length)
  return (
    <>
      <div className="layer" style={{ zIndex: 50 }}>
        {MOTES.map((m, i) => {
          const on = lit.includes(i)
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: on ? 1.5 : 1 }}
              transition={{ delay: i * 0.15, type: 'spring', stiffness: 260, damping: 18 }}
              style={{ position: 'fixed', left: `${m.x * 100}%`, top: `${m.y * 100}%`, width: 0, height: 0 }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -14,
                  top: -14,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: `1.5px solid ${on ? 'var(--ok)' : 'rgba(255,244,226,.85)'}`,
                  background: on ? 'rgba(168,230,196,.35)' : 'rgba(255,244,226,.1)',
                  boxShadow: on ? '0 0 24px rgba(168,230,196,.7)' : '0 0 18px rgba(255,236,205,.45)',
                  transition: 'all .4s',
                }}
              />
            </motion.div>
          )
        })}
      </div>
      <Guide
        id={raised ? 'ht' : 'ht-lost'}
        line={raised ? 'Move your hand. Touch each light with your fingertip.' : 'Raise your hand to continue.'}
        hint={raised ? `${lit.length} of 3 · your simulated hand follows your mouse` : <RaiseHint />}
      />
    </>
  )
}

// ——— 14 · Complete ———
export function HandsReady() {
  const next = useLens((s) => s.next)
  useAfter(2200, next)
  return <Moment show title="Hands ready" sub="You can lower your hand. Next, a few skills." glyph={<Check />} />
}
