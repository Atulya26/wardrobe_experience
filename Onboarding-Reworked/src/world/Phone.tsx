import { Plane } from './primitives'
import { useTarget, useAnchor, useAttended } from '../engine/hooks'
import { useLens } from '../state/store'
import { ConnectRing } from '../lens/GlassBead'

/** Physical shell and reactive display share the original phone anchor. */
export function Phone({ x, y, z }: { x: number; y: number; z: number }) {
  const stage = useLens((s) => s.stage)
  const ref = useTarget<HTMLDivElement>('phone', {
    dwellMs: 700, pad: 46, iris: stage === 4, focusField: true, depth: 2500,
    enabled: stage >= 4, quiet: stage !== 4,
  })
  const anchor = useAnchor<HTMLDivElement>('phone')
  const looked = useAttended('phone')
  const screen = stage < 4 ? 'off' : stage === 4 ? (looked ? 'wake' : 'off') : stage === 5 ? 'pairing' : 'paired'
  return (
    <>
      <Plane x={x + 5} y={y + 7} z={z + 8} w={106} h={202} rx={90} rz={-16} style={{ borderRadius: 23, background: 'rgba(22,18,13,.38)', filter: 'blur(7px)' }} />
      <Plane x={x} y={y + 5} z={z} w={94} h={190} rx={90} rz={-16} style={{ borderRadius: 19, background: 'linear-gradient(90deg,#333a3e,#a4aaad 5%,#4f575c 50%,#c7cccd 95%,#3d4549)' }} />
      <Plane ref={ref} x={x} y={y} z={z} w={94} h={190} rx={90} rz={-16}
        style={{ borderRadius: 19, background: 'linear-gradient(135deg,#d5d7d8,#596267 28%,#232b30 65%,#c2c6c8)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.65), 1px 3px 1px #343b3f, 0 7px 10px rgba(0,0,0,.3)' }}>
        <div style={{ position: 'absolute', right: -2, top: 54, width: 3, height: 28, borderRadius: 2, background: '#848d92' }} />
        <div style={{ position: 'absolute', inset: 3, border: '2px solid #070a0d', borderRadius: 16, overflow: 'hidden', background: screen === 'off' ? 'linear-gradient(145deg,#19262e,#06090d 60%,#263336)' : 'radial-gradient(ellipse at 25% 85%,#6b8687,transparent 60%),linear-gradient(150deg,#18252f,#394f5c 55%,#b0afa0)', transition: 'background .4s' }}>
          <div style={{ position: 'absolute', left: '50%', top: 5, width: 26, height: 7, marginLeft: -13, borderRadius: 8, background: '#020406', boxShadow: '0 1px 1px rgba(255,255,255,.12)', zIndex: 2 }} />
          <div style={{ position: 'absolute', left: '61%', top: 7, width: 3, height: 3, borderRadius: '50%', background: '#1c3445', zIndex: 3 }} />
          {screen === 'wake' && <div style={{ position: 'absolute', top: 29, width: '100%', textAlign: 'center', color: '#fff' }}><div style={{ fontSize: 6, opacity: .8 }}>Good morning</div><div style={{ fontSize: 25, fontWeight: 500, letterSpacing: '-1px', marginTop: 3 }}>7:42</div><div style={{ marginTop: 35, fontSize: 6, letterSpacing: '2px' }}>Companion</div></div>}
          {(screen === 'pairing' || screen === 'paired') && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {screen === 'pairing' ? <ConnectRing size={28} color="#fff4e2" /> : <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden><circle cx="14" cy="14" r="13" fill="rgba(230,255,246,.15)" stroke="#d7f4e6" strokeWidth=".7"/><path d="m8 14 4 4 8-9" fill="none" stroke="#e9fff3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            <div style={{ fontSize: 6, color: '#fff', fontWeight: 500 }}>{screen === 'pairing' ? 'Connecting to companion' : 'Companion connected'}</div>
          </div>}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(125deg,rgba(255,255,255,.3),rgba(255,255,255,.03) 26%,transparent 45%,rgba(225,243,255,.12) 46%,transparent 49%)' }} />
          <div style={{ position: 'absolute', bottom: 5, left: '32%', width: '36%', height: 2, borderRadius: 2, background: 'rgba(255,255,255,.6)', opacity: screen === 'off' ? 0 : 1 }} />
        </div>
        <div ref={anchor} style={{ position: 'absolute', left: '50%', top: '50%' }} />
      </Plane>
    </>
  )
}
