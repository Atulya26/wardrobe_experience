import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLens } from '../../state/store'
import { useTarget, useFrame, useCompactHeight } from '../../engine/hooks'
import { getHandProximity, type SelectMethod } from '../../engine/targets'
import { sound } from '../../engine/sound'
import { Anchored } from '../../lens/Anchored'
import { Guide, Kbd, Ornament } from '../../lens/ui'
import { Swatch, FABRICS, type Fabric } from './Swatch'
import { useAfter } from './common'
import { Detail } from './Detail'
import { SkillIcon } from '../../lens/SkillIcon'

/**
 * Stages 15–19 share one set of fabric swatches so each lesson builds on the
 * last: the swatch you pinch is the one you bring closer and then let go of.
 */
export function SwatchLesson() {
  const stage = useLens((s) => s.stage)
  const next = useLens((s) => s.next)
  const [lifted, setLifted] = useState<Fabric[]>([])
  const [reached, setReached] = useState<Fabric[]>([])
  const raised = useLens((s) => s.handRaised)
  const [chosen, setChosen] = useState<Fabric>('linen')
  const [sel, setSel] = useState<{ pinch?: Fabric; voice?: Fabric }>({})
  const reachTimers = useRef<Record<string, number>>({})

  // 16 · a fingertip held close to a swatch counts as reaching it
  useFrame((dt) => {
    if (stage !== 16) return
    for (const f of FABRICS) {
      if (reached.includes(f.id)) continue
      const p = getHandProximity(`swatch-${f.id}`)
      reachTimers.current[f.id] = p > 0.72 ? (reachTimers.current[f.id] ?? 0) + dt : 0
      if (reachTimers.current[f.id] > 0.35) {
        sound.tick()
        setReached((r) => [...r, f.id])
      }
    }
  })

  const doneGaze = lifted.length === 3
  const doneReach = reached.length >= 2
  useAfter(1500, next, stage === 15 && doneGaze)
  useAfter(1300, next, stage === 16 && doneReach)

  const focusMode = stage >= 18

  const onSelect = (f: Fabric) => (m: SelectMethod) => {
    if (stage !== 17) return
    setChosen(f)
    setSel((s) => (m === 'voice' ? { ...s, voice: f } : { ...s, pinch: f }))
  }

  return (
    <>
      <AnimatePresence>
        {!focusMode &&
          FABRICS.map((f, i) => (
            <LessonSwatch
              key={f.id}
              fabric={f.id}
              index={i}
              stage={stage}
              selected={!!(sel.pinch || sel.voice) && chosen === f.id}
              onSettle={() => stage === 15 && setLifted((l) => (l.includes(f.id) ? l : [...l, f.id]))}
              onSelect={onSelect(f.id)}
            />
          ))}
      </AnimatePresence>
      {focusMode && <Detail fabric={chosen} />}
      {stage === 15 && (
        <Guide
          inputMode="look"
          id={doneGaze ? 'g-done' : 'g'}
          line={doneGaze ? "That's attention." : 'Use your eyes to focus on each sample.'}
          hint={raised ? <>Release <Kbd>Space</Kbd> or press <Kbd>H</Kbd> to lower your hand. Then use the mouse as your eyes.</> : doneGaze ? 'Something that has your attention is ready to act on.' : `Move the mouse to each sample and hold · ${lifted.length} of 3`}
        />
      )}
      {stage === 16 && (
        <Guide
          inputMode="reach"
          id={doneReach ? 'r-done' : 'r'}
          line={doneReach ? 'That’s direct reach.' : 'Bring your hand to a sample. No pinch yet.'}
          hint={
            doneReach ? (
              'Looking lights the whole thing. Reaching lights where you touch.'
            ) : (
              <>
                Hold <Kbd>Space</Kbd> and move · your eyes stay where they were · {reached.length} of 2
              </>
            )
          }
        />
      )}
      {stage === 17 && <SelectGuide sel={sel} onContinue={next} />}
    </>
  )
}

function SelectGuide({ sel, onContinue }: { sel: { pinch?: Fabric; voice?: Fabric }; onContinue: () => void }) {
  const pinched = !!sel.pinch
  return <Guide
    id={pinched ? sel.voice ? 'pinch-voice-done' : 'pinch-done' : 'pinch'}
    inputMode="pinch"
    line={pinched ? sel.voice ? 'Pinch and voice both worked.' : 'Selected with a hand pinch.' : sel.voice ? 'Voice works too. Now try a hand pinch.' : 'Look to focus. Pinch to choose.'}
    hint={pinched ? <span className="optional-voice"><SkillIcon name="Speak" size={22} /><span><b>Voice is optional</b><br />Keep looking at a sample. Hold <Kbd>V</Kbd>, then release to simulate “select”.</span></span> : 'Click or press Enter to simulate bringing your thumb and finger together.'}
    actions={pinched ? <Ornament id="pinch-continue" primary onSelect={onContinue}>Continue to zoom</Ornament> : undefined}
  />
}

function LessonSwatch({
  fabric,
  index,
  stage,
  selected,
  onSettle,
  onSelect,
}: {
  fabric: Fabric
  index: number
  stage: number
  selected: boolean
  onSettle: () => void
  onSelect: (m: SelectMethod) => void
}) {
  const compact = useCompactHeight()
  const ref = useTarget<HTMLDivElement>(`swatch-${fabric}`, {
    iris: stage === 15,
    focusField: stage !== 16,
    depth: 1250,
    dwellMs: stage === 15 ? 900 : 220,
    pad: 18,
    priority: 2,
    hand: stage >= 16,
    quiet: stage === 16,
    selectable: stage === 17,
    onSettle,
    onSelect,
  })
  // a real card held in space foreshortens as it moves off the line of sight
  const tilt = useRef<HTMLDivElement>(null)
  useFrame(() => {
    const el = tilt.current
    if (!el) return
    const r = el.parentElement!.getBoundingClientRect()
    const W = window.innerWidth
    const H = window.innerHeight
    const f = 1000 * Math.max(W / 1600, H / 900)
    const ay = Math.atan((r.left + r.width / 2 - W / 2) / f) * (180 / Math.PI)
    const ax = Math.atan((r.top + r.height / 2 - H / 2) / f) * (180 / Math.PI)
    el.style.transform = `perspective(${f.toFixed(0)}px) rotateY(${(-ay * 0.8).toFixed(2)}deg) rotateX(${(ax * 0.8).toFixed(2)}deg)`
  })
  return (
    <Anchored to="front" dx={(index - 1) * 180} dy={compact ? -115 : -90} smooth={3}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.85, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.8, y: 30, filter: 'blur(12px)' }}
        transition={{ delay: index * 0.12, type: 'spring', stiffness: 140, damping: 20 }}
      >
        <div ref={tilt}>
          <div className="anim" style={{ animation: `float 6s ${index * -2}s ease-in-out infinite` }}>
            <Swatch ref={ref} fabric={fabric} liftable={stage === 15} selected={selected} />
          </div>
        </div>
      </motion.div>
      <style>{`@keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }`}</style>
    </Anchored>
  )
}
