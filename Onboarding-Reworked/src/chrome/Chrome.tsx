import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLens, STAGES, HAND_TONES } from '../state/store'
import { input, recenterView, lockHead, unlockHead, syncHeadTargetToCurrent } from '../engine/input'
import { SymbolIcon } from '../lens/SkillIcon'
import { unlockAudio } from '../engine/sound'
import './chrome.css'
import { panoramaMode } from '../world/camera'

const MAPPINGS = [
  ['Look', 'Move cursor · Shift + arrows'], ['Recenter', 'R'], ['Hold attention', 'Rest on an object'],
  ['Pinch / select', 'Click or Enter'], ['Raise hand', 'Hold Space · H to toggle'],
  ['Voice', 'Hold V, then release'], ['Zoom', 'Trackpad pinch · scroll · + / −'],
  ['Swipe away', 'Click and flick · ← / →'], ['Focus next object', 'Tab · Shift Tab'],
]

function ControlIcon({ kind }: { kind: 'settings' | 'close' | 'previous' | 'next' | 'restart' }) {
  const symbol = { settings: 'slider.horizontal.3', close: 'xmark', previous: 'chevron.left', next: 'chevron.right', restart: 'arrow.counterclockwise' }[kind]
  return <SymbolIcon name={symbol} size={20} />
}

/** Presenter tools live outside the lens fiction, in one native modeless popover. */
export function Chrome() {
  const panel = useRef<HTMLDivElement>(null)
  const stage = useLens((s) => s.stage)
  const sound = useLens((s) => s.sound)
  const reduce = useLens((s) => s.reduceMotion)
  const tone = useLens((s) => s.handTone)
  const setHandTone = useLens((s) => s.setHandTone)
  const slow = useLens((s) => s.dwellScale > 1)
  const open = useLens((s) => s.showHelp)
  const set = useLens.setState
  const { next, prev, setStage } = useLens.getState()
  const name = STAGES[stage - 1].name

  useEffect(() => {
    const el = panel.current!
    const sync = (event: Event) => {
      if (event.target !== el) return
      const shown = el.matches(':popover-open')
      if (useLens.getState().showHelp !== shown) set({ showHelp: shown })
    }
    el.addEventListener('toggle', sync)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ']') next()
      else if (e.key === '[') prev()
      else if (e.key === '?') { e.preventDefault(); set((s) => ({ showHelp: !s.showHelp })) }
      else if (e.key === 'Escape') set({ showHelp: false })
    }
    window.addEventListener('keydown', onKey)
    return () => { el.removeEventListener('toggle', sync); window.removeEventListener('keydown', onKey) }
  }, [next, prev, set])

  useLayoutEffect(() => {
    const el = panel.current!
    if (open && !el.matches(':popover-open')) el.showPopover()
    else if (!open && el.matches(':popover-open')) el.hidePopover()
  }, [open])

  useEffect(() => {
    if (!open) return
    lockHead('presenter-controls')
    return () => { syncHeadTargetToCurrent(); unlockHead('presenter-controls') }
  }, [open])

  useEffect(() => {
    input.range.yaw = panoramaMode ? 8 : 40
    input.range.pitch = panoramaMode ? 7 : 16
    input.breathe = !panoramaMode && !reduce
    document.documentElement.dataset.reduce = String(reduce)
  }, [reduce])

  return <div data-chrome className="chrome">
    <button className="demo-launcher" popoverTarget="demo-controls" aria-label="Open demo controls" title="Demo controls · ?" aria-expanded={open}>
      <ControlIcon kind="settings" />
    </button>
    <div ref={panel} id="demo-controls" popover="auto" className="demo-panel" role="dialog" aria-labelledby="demo-title">
      <header className="demo-header">
        <div><h2 id="demo-title">Demo controls</h2><p>Outside the companion experience</p></div>
        <button className="demo-icon-button" popoverTarget="demo-controls" popoverTargetAction="hide" aria-label="Close demo controls" autoFocus><ControlIcon kind="close" /></button>
      </header>
      <section className="demo-section" aria-label="Stage navigation">
        <div className="demo-stage-label"><span>Onboarding</span><span>{String(stage).padStart(2,'0')} <span className="demo-muted">/ 21</span></span></div>
        <div className="demo-stage-row">
          <button className="demo-icon-button" onClick={prev} disabled={stage === 1} aria-label="Previous stage"><ControlIcon kind="previous" /></button>
          <label className="demo-stage-select"><span className="sr-only">Jump to stage</span><select value={stage} onChange={(e) => setStage(Number(e.target.value))} aria-label="Jump to stage">
            {STAGES.map((s) => <option key={s.n} value={s.n}>{s.n}. {s.name}</option>)}
          </select></label>
          <button className="demo-icon-button" onClick={next} disabled={stage === 21} aria-label="Next stage"><ControlIcon kind="next" /></button>
        </div>
        <div className="demo-progress" aria-hidden="true">{STAGES.map((s) => <span key={s.n} className={s.n < stage ? 'done' : s.n === stage ? 'now' : ''} />)}</div>
        <p className="sr-only" role="status">{name}</p>
      </section>
      <section className="demo-section demo-settings" aria-label="Preferences">
        <button className="demo-setting" role="switch" aria-checked={sound} onClick={() => { unlockAudio(); set({ sound: !sound }) }}><span>Sound<span className="demo-setting-detail">Soft interaction cues</span></span><span className="demo-switch" aria-hidden="true" /></button>
        <button className="demo-setting" role="switch" aria-checked={reduce} onClick={() => set({ reduceMotion: !reduce })}><span>Less motion<span className="demo-setting-detail">Gentler movement and effects</span></span><span className="demo-switch" aria-hidden="true" /></button>
        <button className="demo-setting" role="switch" aria-checked={slow} onClick={() => set({ dwellScale: slow ? 1 : 1.8 })}><span>Slower focus<span className="demo-setting-detail">More time to hold attention</span></span><span className="demo-switch" aria-hidden="true" /></button>
        <div className="demo-setting demo-tone" role="radiogroup" aria-label="Hand tone"><span>Hand tone<span className="demo-setting-detail">How your hand is drawn</span></span><span className="demo-tones">{HAND_TONES.map((t) => <button key={t.id} aria-label={t.label} role="radio" aria-checked={tone === t.id} style={{ background: t.swatch }} onClick={() => setHandTone(t.id)} />)}</span></div>
      </section>
      <details className="demo-section demo-help"><summary>Keyboard & gestures</summary><dl>{MAPPINGS.map(([action, keys]) => <div key={action}><dt>{action}</dt><dd>{keys}</dd></div>)}</dl><p>Gaze, hands, voice and pairing are simulated. No camera or microphone is used.</p></details>
      <div className="demo-section"><button className="demo-restart" onClick={recenterView}>Recenter view <span className="kbd">R</span></button></div>
      <footer className="demo-footer"><button className="demo-restart" onClick={() => { recenterView(); setStage(1); set({ showHelp: false }) }}><ControlIcon kind="restart" />Restart onboarding</button><span>[ / ] step · ? controls</span></footer>
    </div>
  </div>
}
