import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SkillIcon, SymbolIcon } from './SkillIcon'
import { useTarget } from '../engine/hooks'
import type { SelectMethod } from '../engine/targets'
import { useLens } from '../state/store'

const VoiceBeam = lazy(() => import('voice-glow').then(({ VoiceBeam }) => ({ default: VoiceBeam })))

export const spring = { type: 'spring', stiffness: 220, damping: 28, mass: 0.9 } as const
export const soft = { type: 'spring', stiffness: 120, damping: 22 } as const

/** Things arrive from slightly further away and settle forward, and recede the same way. */
export const depthIn = {
  initial: { opacity: 0, scale: 0.94, filter: 'blur(10px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.97, filter: 'blur(8px)' },
}

export function Ornament({
  id,
  children,
  primary,
  onSelect,
  enabled = true,
  style,
}: {
  id: string
  children: ReactNode
  primary?: boolean
  onSelect: (m: SelectMethod) => void
  enabled?: boolean
  style?: React.CSSProperties
}) {
  const ref = useTarget<HTMLButtonElement>(id, { priority: 2, pad: 10, dwellMs: 180, onSelect, enabled })
  return (
    <button type="button" disabled={!enabled} ref={ref} className={`ornament${primary ? ' primary' : ''}`} style={style}>
      {children}
    </button>
  )
}

export const Kbd = ({ children }: { children: ReactNode }) => <span className="kbd">{children}</span>

/**
 * The guide line. The lens speaks rarely and briefly, low in the view,
 * like a subtitle — never a modal. Laptop mappings sit quietly after it.
 */
export function Guide({ id, line, hint, top = false, inputMode, actions }: { id: string; line?: ReactNode; hint?: ReactNode; top?: boolean; inputMode?: InputMode; actions?: ReactNode }) {
  const voice = useLens((s) => s.voice)
  const reduce = useLens((s) => s.reduceMotion)
  return createPortal(
    <div
      className="layer"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: top ? 'flex-start' : 'flex-end',
        paddingBottom: top ? 0 : '5vh',
        paddingTop: top ? '11vh' : 0,
        zIndex: 70,
      }}
    >
      <AnimatePresence mode="wait">
        {line && voice === 'idle' && (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="spatial-guide"
          >
            {inputMode && <InputLegend mode={inputMode} />}
            <div className="shadowed" style={{ fontSize: 18, fontWeight: 590, letterSpacing: '-0.018em', lineHeight: 1.3 }} role="status">
              {line}
            </div>
            {hint && (
              <div className="shadowed" style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-2)', letterSpacing: 0 }}>
                {hint}
              </div>
            )}
            {actions && <div className="guide-actions">{actions}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>, document.body
  )
}

type InputMode = 'look' | 'reach' | 'pinch' | 'zoom' | 'swipe'
function InputLegend({ mode }: { mode: InputMode }) {
  const action = {
    look: null,
    reach: { skill: 'Reach', name: 'Reach', key: 'Space + move' },
    pinch: { skill: 'Pinch', name: 'Pinch', key: 'Click / Enter' },
    zoom: { skill: 'Zoom', name: 'Pinch apart', key: 'Scroll / + −' },
    swipe: { skill: 'Swipe', name: 'Swipe', key: 'Drag / ← →' },
  }[mode]
  return <div className="input-legend" aria-label="Real-world actions and laptop controls">
    <span><SkillIcon name="Look" size={20} /><b>Eyes</b><span>Move mouse</span></span>
    {action && <><i aria-hidden="true">→</i><span><SkillIcon name={action.skill as 'Reach' | 'Pinch' | 'Zoom' | 'Swipe'} size={20} /><b>{action.name}</b><span>{action.key}</span></span></>}
  </div>
}

/** A brief, centred moment of confirmation — no panel, just light and type. */
export function Moment({ show, title, sub, glyph }: { show: boolean; title: string; sub?: string; glyph?: ReactNode }) {
  return (
    <div className="layer" style={{ display: 'grid', placeItems: 'center', zIndex: 45 }}>
      <AnimatePresence>
        {show && (
          <motion.div
            {...depthIn}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="moment-surface"
          >
            {glyph && <div style={{ display: 'grid', placeItems: 'center', marginBottom: 22 }}>{glyph}</div>}
            <div className="title shadowed" role="status">
              {title}
            </div>
            {sub && (
              <div className="body shadowed" style={{ marginTop: 8 }}>
                {sub}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Check({ size = 56, color = 'var(--ok)' }: { size?: number; color?: string }) {
  return <span aria-hidden="true" style={{ display: 'inline-grid', placeItems: 'center', width: size, height: size, position: 'relative', color }}>
    <svg width={size} height={size} viewBox="0 0 56 56" style={{ position: 'absolute', inset: 0 }}>
      <motion.circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: .45 }} />
    </svg>
    <SymbolIcon name="checkmark" size={size * .64} />
  </span>
}

// A synthetic level follows the existing simulation; no microphone is requested.
function simulatedVoiceLevel() {
  const { voice, reduceMotion } = useLens.getState()
  if (voice === 'empty' || voice === 'idle') return 0
  if (reduceMotion) return .3
  return .35 + .22 * Math.sin(performance.now() / 130) + .12 * Math.sin(performance.now() / 53)
}

export function VoiceCapsule() {
  const voice = useLens((s) => s.voice)
  const transcript = useLens((s) => s.voiceTranscript)
  const reduce = useLens((s) => s.reduceMotion)
  const surface = <div className="voice-surface" role="status">
    <span className="voice-symbol"><SkillIcon name="Speak" size={22} /></span>
    <div className="voice-copy">
      <div className="voice-label">{voice === 'listening' ? 'Listening…' : voice === 'heard' ? `“${transcript}”` : 'Look at something first'}</div>
      <div className="voice-caption">Simulated voice · hold V, then release</div>
    </div>
  </div>
  return (
    <div className="layer voice-layer">
      <AnimatePresence>
        {voice !== 'idle' && <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 8, scale: .97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduce ? 0 : 5, scale: .98 }}
          transition={{ duration: .2, ease: [0.22,1,0.36,1] }}>
          <Suspense fallback={surface}><VoiceBeam type="pill" level={simulatedVoiceLevel} theme="dark" colorVariant="gold" colors={['#fff4e2', '#ffe6c2', '#f6cf9c', '#e9b77f']}
            paused={reduce} strength={.85} distortion={0} reach={.8} idle={.1}
            borderRadius={30} style={{ width: 'min(360px, calc(100vw - 40px))' }}>
            {surface}
          </VoiceBeam></Suspense>
        </motion.div>}
      </AnimatePresence>
    </div>
  )
}
