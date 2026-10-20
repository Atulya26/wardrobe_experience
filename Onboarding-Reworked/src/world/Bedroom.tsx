import type { CSSProperties } from 'react'
import { Plane, Group, Box } from './primitives'
import { useRef } from 'react'
import { useAnchor, useTarget, useFrame } from '../engine/hooks'
import { input } from '../engine/input'
import { useLens } from '../state/store'
import { Phone } from './Phone'
import { SunPatch, Bounce, Dust, Curtains } from './Light'

// A bedroom on a clear morning. Eye height 1600mm; the wearer stands
// near the middle of the room facing the wardrobe.

const FLOOR = 1600
const CEIL = -1100
const BACK = -3000
const SIDE = 2600
const NEAR = 0

const plaster = (tone = 0): CSSProperties => ({
  backgroundImage: `radial-gradient(ellipse at 22% 35%, rgba(255,250,239,${.3 + tone}), transparent 68%), linear-gradient(180deg,rgba(74,61,44,.04),rgba(74,61,44,.15)), url('/assets/realism/plaster.webp')`,
  backgroundSize: 'auto, auto, 600px 600px',
  boxShadow: 'inset 0 -14px 26px rgba(48,37,24,.12), inset 0 8px 20px rgba(55,43,29,.08)',
})
const wood = (shade = .12): CSSProperties => ({
  backgroundImage: `linear-gradient(rgba(30,19,12,${shade}), rgba(30,19,12,${shade})), url('/assets/realism/walnut.webp')`,
  backgroundSize: '420px 1300px',
  boxShadow: 'inset 0 1px 2px rgba(255,240,220,.16), inset 0 -2px 4px rgba(35,20,10,.16)',
})
const oak: CSSProperties = {
  backgroundImage: "linear-gradient(180deg,rgba(35,26,15,.25),transparent 40%), url('/assets/realism/oak-floor.webp')",
  backgroundSize: 'auto, 560px 560px',
  boxShadow: 'inset 0 12px 22px rgba(30,22,14,.23)',
}
const woodFace = wood(.08)
const woodInner = wood(.36)

export function Bedroom() {
  return (
    <>
      <Group layer={0}><Room /></Group>
      <Plane x={-1480} y={FLOOR - 4} z={-1670} w={1250} h={760} rx={90} style={{ background: 'radial-gradient(ellipse, rgba(35,26,16,.32), transparent 70%)' }} />
      <Window />
      <Curtains />
      <SunPatch />
      <Bounce />
      <Dust />
      <Wardrobe />
      <Dresser />
      <Mirror />
      <Art />
      <Plant />
    </>
  )
}

// Ambient occlusion: light can't reach into corners, so every junction darkens softly.
const AO = 'rgba(58,42,26,'
const ao = (edges: { t?: number; b?: number; l?: number; r?: number }) => ({
  position: 'absolute' as const,
  inset: 0,
  pointerEvents: 'none' as const,
  background: [
    edges.t && `linear-gradient(180deg, ${AO}${edges.t}), transparent 7%)`,
    edges.b && `linear-gradient(0deg, ${AO}${edges.b}), transparent 5%)`,
    edges.l && `linear-gradient(90deg, ${AO}${edges.l}), transparent 9%)`,
    edges.r && `linear-gradient(270deg, ${AO}${edges.r}), transparent 9%)`,
  ]
    .filter(Boolean)
    .join(', '),
})

function Room() {
  const floorAnchor = useAnchor<HTMLDivElement>('floor')
  const depth = NEAR - BACK
  const zc = (NEAR + BACK) / 2
  const hgt = FLOOR - CEIL
  const yc = (FLOOR + CEIL) / 2
  return (
    <>
      {/* back wall */}
      <Plane z={BACK} y={yc} w={SIDE * 2} h={hgt} res={4} style={plaster(0.1)}>
        <div className="grain" />
        <div style={ao({ t: 0.2, b: 0.24, l: 0.26, r: 0.3 })} />
        <div className="mesh" />
      </Plane>
      {/* left wall — window side, brighter */}
      <Plane x={-SIDE} y={yc} z={zc} w={depth} h={hgt} ry={90} res={4} style={plaster(0.25)}>
        <div className="grain" />
        <div style={ao({ t: 0.16, b: 0.2, r: 0.24 })} />
        <div className="mesh" />
      </Plane>
      {/* right wall — away from the light */}
      <Plane x={SIDE} y={yc} z={zc} w={depth} h={hgt} ry={-90} res={4} style={{ ...plaster(-0.2), filter: 'brightness(.88)' }}>
        <div className="grain" />
        <div style={ao({ t: 0.2, b: 0.24, l: 0.28 })} />
        <div className="mesh" />
      </Plane>
      {/* floor */}
      <Plane y={FLOOR} z={zc} w={SIDE * 2} h={depth} rx={90} res={4} style={oak}>
        <div className="grain" style={{ opacity: 0.3 }} />
        <div style={ao({ t: 0.32, l: 0.22, r: 0.3 })} />
        {/* soft sheen: the oak's finish catching the bright window */}
        <div style={{ position: 'absolute', left: 0, top: '8%', width: '14%', height: '62%', background: 'linear-gradient(90deg, rgba(255,246,228,.18), transparent)', filter: 'blur(8px)' }} />
        {/* rug: a dense bouclé, at real scale */}
        <div
          style={{
            position: 'absolute',
            left: '33%',
            top: '42%',
            width: '36%',
            height: '40%',
            borderRadius: 4,
            backgroundImage: "linear-gradient(rgba(222,210,190,.38), rgba(222,210,190,.38)), url('/assets/realism/cotton.webp')",
            backgroundSize: 'auto, 34px 34px',
            boxShadow: 'inset 0 0 0 5px rgba(196,180,154,.55), inset 0 0 14px rgba(80,60,35,.18), 0 1px 0 rgba(255,250,240,.4), 0 3px 6px rgba(40,28,14,.22)',
          }}
        />
        <div ref={floorAnchor} style={{ position: 'absolute', left: '50%', top: '46%' }} />
        <div className="mesh" />
      </Plane>
      {/* ceiling: same plaster, brighter toward the window, shaded into the corners */}
      <Plane y={CEIL} z={zc} w={SIDE * 2} h={depth} rx={-90} res={4} style={{ ...plaster(0.05), filter: 'brightness(1.04)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,248,236,.25), transparent 45%, rgba(60,44,28,.08))' }} />
        <div style={ao({ t: 0.06, b: 0.16, l: 0.14, r: 0.2 })} />
        <div className="mesh" />
      </Plane>
      {/* diffuse skylight on the back wall near the window corner (the sun itself doesn't reach it) */}
      <Plane x={-1900} y={300} z={BACK + 2} w={1500} h={2200} res={4} style={{ background: 'radial-gradient(50% 50% at 25% 45%, rgba(255,240,214,.3), transparent 70%)' }} />
      <Trim depth={depth} zc={zc} />
    </>
  )
}

/** Cove cornice and real skirting boards, so every junction has a physical edge. */
function Trim({ depth, zc }: { depth: number; zc: number }) {
  const cove: CSSProperties = { clipPath: 'polygon(0 0, 100% 0, calc(100% - 64px) 100%, 64px 100%)', background: 'linear-gradient(180deg, #d9d1c5, #ece6dc 55%, #f3eee6)', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,.6)' }
  const skirtFront: CSSProperties = { background: 'linear-gradient(180deg, #f1ece4 0 6%, #e7e0d5 10%, #ddd5c8)', boxShadow: 'inset 0 -2px 3px rgba(60,44,28,.18)' }
  const skirtTop: CSSProperties = { background: '#f6f2ec' }
  return (
    <>
      <Plane y={CEIL + 32} z={BACK + 32} w={SIDE * 2} h={90} rx={45} style={cove} />
      <Plane x={-SIDE + 32} y={CEIL + 32} z={zc} w={depth} h={90} ry={90} rx={45} style={cove} />
      <Plane x={SIDE - 32} y={CEIL + 32} z={zc} w={depth} h={90} ry={-90} rx={45} style={cove} />
      <Box x={0} y={FLOOR - 48} z={BACK + 9} w={SIDE * 2} h={96} d={18} faces={{ front: skirtFront, top: skirtTop }} />
      <Group x={-SIDE + 9} z={zc} ry={90}>
        <Box y={FLOOR - 48} w={depth} h={96} d={18} faces={{ front: skirtFront, top: skirtTop }} />
      </Group>
      <Group x={SIDE - 9} z={zc} ry={-90}>
        <Box y={FLOOR - 48} w={depth} h={96} d={18} faces={{ front: { ...skirtFront, filter: 'brightness(.9)' }, top: skirtTop }} />
      </Group>
    </>
  )
}

function Window() {
  const anchor = useAnchor<HTMLDivElement>('window')
  const pane = useAnchor<HTMLDivElement>('window-pane')
  return (
    <Plane x={-SIDE + 8} y={60} z={-1850} w={1500} h={1700} ry={90}
      style={{ background: "url('/assets/realism/window-graded.webp') center / 100% 100%", boxShadow: '0 0 0 15px #e6dfd2, 14px 12px 28px rgba(60,45,26,.2)' }}>
      <div ref={pane} style={{ position: 'absolute', inset: '4% 13% 14% 13%' }} />
      <div ref={anchor} style={{ position: 'absolute', left: '55%', top: '30%' }} />
    </Plane>
  )
}

// Garments are slices of one cutout so they stay continuous, but each hangs at
// its own depth and can be addressed on its own (journey 2 needs that).
const CLOTHES = { src: '/assets/realism/clothes.webp', w: 1536, h: 1024 }
const GARMENT_SLICES: { id: string; a: number; b: number }[] = [
  { id: 'linen-shirt', a: 0, b: 436 },
  { id: 'striped-shirt', a: 430, b: 636 },
  { id: 'white-tee', a: 630, b: 806 },
  { id: 'grey-knit', a: 800, b: 1051 },
  { id: 'denim-jacket', a: 1045, b: 1206 },
  { id: 'camel-coat', a: 1200, b: 1536 },
]
const SHOES = { src: '/assets/realism/shoes.webp', w: 2172, h: 724 }
const SHOE_SLICES = [
  // boundaries measured from the cutout's alpha so no pair bleeds into the next
  { id: 'white-sneakers', a: 30, b: 722, x: -470 },
  { id: 'brown-boots', a: 722, b: 1436, x: 0 },
  { id: 'brown-loafers', a: 1436, b: 2172, x: 470 },
]

function Wardrobe() {
  const anchor = useAnchor<HTMLDivElement>('wardrobe')
  const W = 1560
  const H = 2160
  const D = 560
  const cx = -150
  const front = BACK + D
  const top = FLOOR - H
  const inner = W - 80
  const mid = BACK + D / 2
  const railY = top + 90
  const shelf1 = 700
  const shelf2 = 1120
  const k = (inner * 0.97) / CLOTHES.w // mm per source px
  const imgW = CLOTHES.w * k
  const imgH = CLOTHES.h * k
  const imgTop = railY - 10 * k - 8
  const ks = 0.48
  const shoeTop = shelf2 - 601 * ks // soles sit on the shelf
  const shelf = (y: number) => (
    <>
      <Box y={y + 12} z={mid - 10} w={inner} h={24} d={D - 40} faces={{ front: { ...wood(0.08), backgroundSize: '1400px 1300px' }, top: { ...wood(0.2), backgroundSize: '1400px 1300px' } }} />
      {/* shadow the shelf throws on the back panel and on what sits beneath it */}
      <Plane y={y + 70} z={BACK + 14} w={inner} h={110} style={{ background: 'linear-gradient(180deg, rgba(20,12,6,.45), transparent)' }} />
    </>
  )
  return (
    <Group x={cx}>
      {/* carcass interior */}
      <Plane y={top + H / 2} z={BACK + 10} w={inner} h={H - 60} style={{ ...wood(0.42), backgroundSize: '420px 1300px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(18,10,4,.5), transparent 18%, transparent 80%, rgba(18,10,4,.35)), linear-gradient(90deg, rgba(18,10,4,.3), transparent 20%, transparent 85%, rgba(255,232,200,.05))' }} />
        {/* soft shadow of the hanging clothes against the back */}
        <div style={{ position: 'absolute', left: '4%', right: '4%', top: '8%', height: '44%', borderRadius: '40%', background: 'radial-gradient(closest-side, rgba(15,8,3,.42), transparent)' }} />
      </Plane>
      <Plane x={-inner / 2} y={top + H / 2} z={mid} w={D} h={H} ry={90} style={{ ...woodInner, backgroundSize: '420px 1300px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,232,200,.06), rgba(18,10,4,.35))' }} />
      </Plane>
      {/* light from the window lands on the inner right side */}
      <Plane x={inner / 2} y={top + H / 2} z={mid} w={D} h={H} ry={-90} style={{ ...wood(0.3), backgroundSize: '420px 1300px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(270deg, rgba(18,10,4,.3), rgba(255,232,200,.1))' }} />
      </Plane>
      <Plane y={top + 40} z={mid} w={inner} h={D} rx={-90} style={{ ...wood(0.55), backgroundSize: '1400px 1300px' }} />
      {/* rail and brackets */}
      <Plane y={railY} z={BACK + 300} w={inner - 8} h={18} style={{ borderRadius: 9, background: 'linear-gradient(180deg, #f0ede8, #a9a49c 45%, #6f6a63 60%, #c8c3bb)' }} />
      {[-1, 1].map((sd) => (
        <Plane key={sd} x={sd * (inner / 2 - 8)} y={railY} z={BACK + 300} w={16} h={44} style={{ borderRadius: 4, background: 'linear-gradient(90deg, #8f8a83, #d6d1c9, #8a857e)' }} />
      ))}
      {GARMENT_SLICES.map((g, i) => {
        const a = Math.max(0, g.a - 6)
        const b = Math.min(CLOTHES.w, g.b + 6)
        return (
          <Plane key={g.id} x={-imgW / 2 + ((a + b) / 2) * k} y={imgTop + imgH / 2} z={BACK + 292 + (i % 2) * 7 + i * 2} w={(b - a) * k} h={imgH}
            className="garment" style={{ backgroundImage: `url('${CLOTHES.src}')`, backgroundSize: `${imgW}px ${imgH}px`, backgroundPosition: `${-a * k}px 0`, backgroundRepeat: 'no-repeat', filter: 'brightness(.9) saturate(.95) sepia(.04)' }} />
        )
      })}
      {/* interior shade: less light reaches the top of the wardrobe */}
      <Plane y={top + 260} z={BACK + 420} w={inner} h={420} style={{ background: 'linear-gradient(180deg, rgba(20,12,5,.38), transparent)' }} />
      {shelf(shelf1)}
      <Plane y={shelf1 - 108} z={BACK + 330} w={1057} h={216} style={{ background: "url('/assets/realism/folded.webp') center / 100% 100% no-repeat", filter: 'brightness(.92)' }} />
      <Plane y={shelf1 - 4} z={BACK + 360} w={1080} h={30} rx={90} style={{ background: 'radial-gradient(50% 50% at 50% 30%, rgba(15,8,3,.4), transparent)' }} />
      {shelf(shelf2)}
      {SHOE_SLICES.map((sh, i) => (
        <Plane key={sh.id} x={sh.x} y={shoeTop + (SHOES.h * ks) / 2} z={BACK + 340 + i * 4} w={(sh.b - sh.a) * ks} h={SHOES.h * ks}
          style={{ backgroundImage: `url('${SHOES.src}')`, backgroundSize: `${SHOES.w * ks}px ${SHOES.h * ks}px`, backgroundPosition: `${-sh.a * ks}px 0`, backgroundRepeat: 'no-repeat', filter: 'brightness(.88) saturate(.95)' }} />
      ))}
      <Plane y={shelf2 - 3} z={BACK + 370} w={1300} h={40} rx={90} style={{ background: 'radial-gradient(50% 50% at 50% 35%, rgba(15,8,3,.4), transparent)' }} />
      {/* drawer below the shoe shelf */}
      <Box y={(shelf2 + 24 + FLOOR - 90) / 2 + 12} z={front - 30} w={inner} h={FLOOR - 90 - shelf2 - 36} d={20}
        faces={{ front: { ...wood(0.06), backgroundSize: '1400px 1300px', boxShadow: 'inset 0 2px 0 rgba(255,240,220,.12), inset 0 -3px 6px rgba(20,10,4,.3)' } }}
        frontChildren={<div style={{ position: 'absolute', left: '50%', top: '42%', width: 220, height: 16, marginLeft: -110, borderRadius: 5, background: 'linear-gradient(180deg,#c1ae8d,#6f5c43 60%,#493c2e)', boxShadow: '0 6px 8px rgba(0,0,0,.28)' }} />} />
      {/* front frame */}
      <Plane y={top + 30} z={front} w={W} h={60} style={woodFace} />
      <Plane x={-W / 2 + 20} y={top + H / 2} z={front} w={40} h={H} style={woodFace} />
      <Plane x={W / 2 - 20} y={top + H / 2} z={front} w={40} h={H} style={woodFace} />
      <Plane y={FLOOR - 45} z={front} w={W} h={90} style={woodFace} />
      {/* outer carcass sides, seen as you look past the wardrobe */}
      <Plane x={-W / 2} y={top + H / 2} z={mid} w={D} h={H} ry={-90} style={{ ...wood(0.2), backgroundSize: '420px 1300px' }} />
      <Plane x={W / 2} y={top + H / 2} z={mid} w={D} h={H} ry={90} style={{ ...wood(0.3), backgroundSize: '420px 1300px' }} />
      <Plane y={top} z={mid} w={W} h={D} rx={90} style={{ ...wood(0.15), backgroundSize: '1400px 1300px' }} />
      {/* open doors */}
      <Door hingeX={-W / 2} z={front} y={top + H / 2} w={W / 2} h={H} side="left" />
      <Door hingeX={W / 2} z={front} y={top + H / 2} w={W / 2} h={H} side="right" />
      {/* occlusion where the wardrobe meets wall and floor */}
      <Plane x={W / 2 + 140} y={top + H / 2} z={BACK + 3} w={280} h={H} style={{ background: 'linear-gradient(90deg, rgba(40,26,12,.26), transparent)' }} />
      <Plane x={-W / 2 - 140} y={top + H / 2} z={BACK + 3} w={280} h={H} style={{ background: 'linear-gradient(270deg, rgba(40,26,12,.14), transparent)' }} />
      <Plane y={FLOOR - 2} z={front + 90} w={W + 160} h={180} rx={90} style={{ background: 'linear-gradient(180deg, rgba(30,20,10,.42), transparent)' }} />
      <Plane ref={anchor} x={0} y={top - 80} z={front} w={0} h={0} />
      <WardrobeHit top={top} H={H} W={W} front={front} />
    </Group>
  )
}

/** An invisible face covering the wardrobe opening — what the eyes "land" on. */
function WardrobeHit({ top, H, W, front }: { top: number; H: number; W: number; front: number }) {
  const stage = useLens((s) => s.stage)
  const ref = useTarget<HTMLDivElement>('wardrobe', { enabled: stage === 21, dwellMs: 450, focusField: true, depth: 2750, pad: 0, quiet: true })
  return <Plane ref={ref} y={top + H / 2} z={front - 120} w={W - 120} h={H - 160} style={{ pointerEvents: 'none' }} />
}

function Door({ hingeX, z, y, w, h, side }: { hingeX: number; z: number; y: number; w: number; h: number; side: 'left' | 'right' }) {
  // swung fully open, as wardrobe doors usually are — they sit back toward the wall
  const angle = side === 'left' ? -162 : 150
  const off = side === 'left' ? w / 2 : -w / 2
  return (
    <Group x={hingeX} y={y} z={z} ry={angle}>
      <Plane x={off} z={0} w={w} h={h} style={{ ...woodFace, boxShadow: 'inset 0 0 0 3px rgba(255,230,200,.15), inset 0 0 40px rgba(40,25,10,.12)' }}>
        <div style={{ position: 'absolute', inset: '85px 65px', borderRadius: 3, boxShadow: '0 1px 2px rgba(255,245,220,.25), inset 0 2px 5px rgba(30,18,8,.3)', background: 'rgba(35,20,8,.08)' }} />
        <div style={{ position: 'absolute', right: side === 'left' ? 38 : undefined, left: side === 'right' ? 38 : undefined, top: '48%', width: 12, height: 210, borderRadius: 6, background: 'linear-gradient(90deg,#66533f,#cdbb9e,#77634c)', boxShadow: '5px 3px 8px rgba(0,0,0,.3)' }} />
      </Plane>
      {/* the door's free edge — 24 mm of solid walnut */}
      <Plane x={off * 2} z={-12} w={24} h={h} ry={side === 'left' ? 90 : -90} style={{ background: 'linear-gradient(90deg, #4f3a29, #6e5440 50%, #4f3a29)' }} />
      {/* the inside face — what you see with the door open: a framed panel, hinges, window light */}
      <Plane x={off} z={-24} w={w} h={h} ry={180} style={wood(.15)}>
        <div style={{ position: 'absolute', inset: '110px 90px', borderRadius: 2, background: 'rgba(30,18,8,.06)', boxShadow: 'inset 0 3px 6px rgba(25,14,6,.35), inset 0 -2px 2px rgba(255,236,210,.14), 0 -1px 0 rgba(25,14,6,.25), 0 2px 0 rgba(255,236,210,.12)' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${side === 'left' ? 270 : 90}deg, rgba(255,236,206,.1), transparent 55%), linear-gradient(180deg, rgba(20,12,6,.18), transparent 22%, transparent 85%, rgba(20,12,6,.22))` }} />
        {[0.12, 0.5, 0.88].map((t) => (
          <div key={t} style={{ position: 'absolute', top: `calc(${t * 100}% - 45px)`, [side === 'left' ? 'right' : 'left']: 0, width: 22, height: 90, borderRadius: 2, background: 'linear-gradient(90deg, #8d877f, #d9d4cc 45%, #97918a)', boxShadow: '0 2px 3px rgba(0,0,0,.3)' } as CSSProperties} />
        ))}
      </Plane>
    </Group>
  )
}

function Dresser() {
  const anchor = useAnchor<HTMLDivElement>('dresser')
  const w = 1000
  const h = 860
  const d = 480
  const x = -1560
  const zc = -1640
  const yc = FLOOR - h / 2
  return (
    <>
      <Box
        x={x}
        y={yc}
        z={zc}
        w={w}
        h={h}
        d={d}
        faces={{
          front: { ...wood(.12), backgroundSize: '1000px 1300px' },
          top: { background: '#6f513b' },
          right: { ...wood(.28), backgroundSize: '1000px 1300px' },
        }}
        topChildren={<GrainTop w={w} d={d} />}
        frontChildren={
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ position: 'absolute', left: 30, right: 30, top: 50 + i * 260, height: 230, borderRadius: 4, background: 'linear-gradient(180deg,rgba(255,235,205,.03),rgba(45,25,10,.05))', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,.14), inset 0 2px 0 rgba(255,255,255,.08)' }}>
                <div style={{ position: 'absolute', left: '50%', top: 100, width: 160, height: 18, marginLeft: -80, borderRadius: 5, background: 'linear-gradient(180deg,#c1ae8d,#6f5c43 60%,#493c2e)', boxShadow: '0 7px 9px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,240,210,.5)' }} />
              </div>
            ))}
          </>
        }
      />
      <Box x={x} y={FLOOR - h - 7} z={zc} w={w + 24} h={14} d={d + 18}
        faces={{ front: { ...wood(.13), backgroundSize: '1000px 1000px' }, top: { background: '#6f513b' }, right: wood(.26) }}
        topChildren={<GrainTop w={w + 24} d={d + 18} sun />} />
      <Book x={x - 245} y={FLOOR - h - 33} z={zc - 50} ry={-7} cover="#c5b89a" w={310} />
      <Book x={x - 240} y={FLOOR - h - 73} z={zc - 54} ry={4} cover="#566457" w={290} />
      <Bowl x={x + 5} y={FLOOR - h - 15} z={zc - 35} />
      <Phone x={x + 170} y={FLOOR - h - 17} z={zc - 30} />
      <Plane ref={anchor} x={x} y={FLOOR - h - 300} z={zc} w={0} h={0} />
    </>
  )
}

// Wall-mounted mirror. Glass spans x 1396–2004, y −284–1424 (mm), just proud of the back wall.
// set right of centre so the open right-hand door never hides it
const MIRROR = { x: 2150, w: 660, h: 1760, bottom: 1450, frame: 26 }
const GLASS = {
  x0: MIRROR.x - MIRROR.w / 2 + MIRROR.frame,
  x1: MIRROR.x + MIRROR.w / 2 - MIRROR.frame,
  y0: MIRROR.bottom - MIRROR.h + MIRROR.frame,
  y1: MIRROR.bottom - MIRROR.frame,
}
const MIRROR_Z = BACK + 4

/**
 * The reflection is drawn inside the glass from this room's own materials —
 * right wall, floor and skirting — laid out from the real geometry
 * (where the floor line falls as the wall recedes). It shifts with the eye's
 * position the way a reflection does. Geometry is never mirrored in 3D: a
 * mirrored room breaks Chrome's depth sorting for the whole scene.
 */
function Mirror() {
  const anchor = useAnchor<HTMLDivElement>('mirror')
  const stage = useLens((s) => s.stage)
  const ref = useTarget<HTMLDivElement>('mirror', { enabled: stage === 21, dwellMs: 450, focusField: true, depth: 3700, pad: 0, quiet: true })
  const glass = useRef<HTMLDivElement>(null)
  const gw = GLASS.x1 - GLASS.x0
  const gh = GLASS.y1 - GLASS.y0
  const gy = (GLASS.y0 + GLASS.y1) / 2
  const f = MIRROR.frame
  useFrame(() => {
    const el = glass.current
    if (!el) return
    // eye translation from the neck-pivot swing and lean (mm); far things in a mirror move with the eye
    const yaw = (input.head.yaw * Math.PI) / 180
    const pitch = (input.head.pitch * Math.PI) / 180
    const ex = 95 * Math.sin(yaw) + input.eye.x
    const ey = -95 * Math.sin(pitch) + input.eye.y
    el.style.setProperty('--ex', `${ex.toFixed(1)}px`)
    el.style.setProperty('--ey', `${ey.toFixed(1)}px`)
  })
  // where the reflected right wall meets the floor, at the glass's left and right edges (mm from top),
  // projected from the eye through the glass onto the mirrored wall
  const jl = 1420
  const jr = 1794
  const pad = 80
  const oak: CSSProperties = { background: 'linear-gradient(180deg, #ccb08a, #b6976d)', boxShadow: 'inset 0 1px 0 rgba(255,245,225,.45)' }
  const oakSide: CSSProperties = { background: '#9c7f58' }
  return (
    <>
      <Plane ref={ref} x={MIRROR.x} y={gy} z={MIRROR_Z} w={gw} h={gh} style={{ overflow: 'hidden', background: '#bdb4a8' }}>
        <div ref={glass} style={{ position: 'absolute', inset: 0 }}>
          {/* reflected right wall: further away, in shade */}
          <div className="refl" style={{ ['--k' as string]: 0.34, inset: -pad, backgroundImage: "url('/assets/realism/plaster.webp')", backgroundSize: '900px 900px', filter: 'brightness(.8) saturate(.9)' }} />
          <div className="refl" style={{ ['--k' as string]: 0.34, inset: -pad, background: 'linear-gradient(90deg, rgba(40,30,20,.22), transparent 30%, transparent 70%, rgba(255,240,220,.08))' }} />
          {/* skirting, then the floor receding toward the room's far end */}
          <div className="refl" style={{ ['--k' as string]: 0.3, inset: -pad, clipPath: `polygon(0 ${jl + pad - 52}px, 100% ${jr + pad - 66}px, 100% ${jr + pad}px, 0 ${jl + pad}px)`, background: 'linear-gradient(180deg, #ece6dc, #d8d0c4)' }} />
          <div className="refl" style={{ ['--k' as string]: 0.3, inset: -pad, clipPath: `polygon(0 ${jl + pad}px, 100% ${jr + pad}px, 100% 100%, 0 100%)` }}>
            <div style={{ position: 'absolute', left: '-20%', right: '-20%', top: jl - 40, height: 900, backgroundImage: "linear-gradient(180deg, rgba(30,20,10,.35), rgba(30,20,10,.05) 30%), url('/assets/realism/oak-floor.webp')", backgroundSize: 'auto, 260px 260px', transform: 'skewY(31.6deg)', transformOrigin: '0 0', filter: 'brightness(.86)' }} />
          </div>
          {/* window light reaching the reflected wall's near end */}
          <div className="refl" style={{ ['--k' as string]: 0.34, inset: -80, background: 'radial-gradient(70% 50% at 20% 35%, rgba(255,240,216,.16), transparent 70%)' }} />
          {/* the glass itself: faint green-grey tint, darker toward the edges, one long highlight */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(118deg, rgba(255,255,255,.07) 18%, rgba(255,255,255,0) 34%, rgba(255,255,255,0) 70%, rgba(255,255,255,.05) 82%), rgba(64,84,80,.09)', boxShadow: 'inset 0 0 34px rgba(20,30,28,.28)' }} />
          <div className="mesh" />
        </div>
      </Plane>
      {/* frame with depth, and its shadow on the wall */}
      <Plane x={MIRROR.x + 18} y={gy + 22} z={BACK + 2} w={MIRROR.w + 30} h={MIRROR.h + 30} style={{ boxShadow: '0 0 40px 10px rgba(40,26,12,.22)', borderRadius: 4, background: 'transparent' }} />
      <Box x={MIRROR.x} y={GLASS.y0 - f / 2} z={BACK + 17} w={MIRROR.w} h={f} d={34} faces={{ front: oak, top: oakSide }} />
      <Box x={MIRROR.x} y={GLASS.y1 + f / 2} z={BACK + 17} w={MIRROR.w} h={f} d={34} faces={{ front: oak, top: { background: '#d8c09c' } }} />
      <Box x={GLASS.x0 - f / 2} y={gy} z={BACK + 17} w={f} h={gh} d={34} faces={{ front: oak, right: oakSide, left: oakSide }} />
      <Box x={GLASS.x1 + f / 2} y={gy} z={BACK + 17} w={f} h={gh} d={34} faces={{ front: oak, left: oakSide }} />
      <Plane ref={anchor} x={MIRROR.x} y={GLASS.y0 - f - 60} z={BACK + 20} w={0} h={0} />
    </>
  )
}

function Art() {
  const frame: CSSProperties = { background: 'linear-gradient(180deg, #3a322b, #2a241f)' }
  return (
    // hung on the right wall, clear of the open wardrobe door
    <Group x={SIDE} z={-1650} ry={-90}>
      <Box x={0} y={-120} z={16} w={468} h={608} d={30} faces={{ front: frame, top: { background: '#4a4038' }, right: { background: '#231e1a' } }} />
      <Plane x={0} y={-120} z={38} w={440} h={580} style={{ background: '#efe9de', boxShadow: 'inset 0 2px 4px rgba(30,20,10,.35)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/assets/realism/plaster.webp')", backgroundSize: '300px 300px', opacity: 0.25, mixBlendMode: 'multiply' }} />
        {/* bevelled window cut in the mat */}
        <div style={{ position: 'absolute', left: 58, top: 66, right: 58, bottom: 92, border: '3px solid #e8e1d5', boxShadow: 'inset 0 1px 2px rgba(120,100,80,.18)', overflow: 'hidden', background: '#f3ede1' }}>
          <svg viewBox="0 0 324 422" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
            <circle cx="190" cy="168" r="92" fill="#bf7357" opacity=".88" />
            <rect x="30" y="236" width="264" height="150" fill="#d6c4a2" />
            <path d="M30 236 L294 236" stroke="#2e2924" strokeWidth="1.5" />
          </svg>
          <div className="grain" style={{ opacity: 0.35 }} />
        </div>
        {/* glazing: a soft reflection of the window light */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(118deg, rgba(255,255,255,.0) 20%, rgba(255,255,255,.22) 32%, rgba(255,255,255,0) 44%)' }} />
      </Plane>
    </Group>
  )
}

function Plant() {
  return (
    <>
      {/* by the window, where a snake plant would actually be kept */}
      <Plane x={-2250} y={FLOOR - 2} z={-850} w={650} h={440} rx={90}
        style={{ background: 'radial-gradient(ellipse,rgba(35,28,17,.35),rgba(35,28,17,.14) 36%,transparent 69%)' }} />
      <Plane x={-2250} y={FLOOR - 555 + 18} z={-850} w={740} h={1110} ry={63}>
        <img src="/assets/realism/plant.webp" alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block', filter: 'brightness(.93)' }} />
      </Plane>
    </>
  )
}

/** Walnut grain along a tabletop's length (the texture runs vertically, so turn it). */
function GrainTop({ w, d, sun = false }: { w: number; d: number; sun?: boolean }) {
  return (
    <>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: d, height: w, transform: 'translate(-50%, -50%) rotate(90deg)', ...wood(0.08), backgroundSize: '420px 1300px' }} />
      {sun && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,236,206,.26), rgba(255,236,206,.08) 40%, transparent 60%), linear-gradient(0deg, rgba(255,250,240,.07), transparent)' }} />}
    </>
  )
}

/** Actual depth keeps book edges in perspective as the wearer looks around. */
function Book({ x, y, z, ry, cover, w }: { x: number; y: number; z: number; ry: number; cover: string; w: number }) {
  const cloth: CSSProperties = { backgroundImage: `linear-gradient(${cover}cc,${cover}cc),url('/assets/realism/cotton.webp')`, backgroundSize: 'cover', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)' }
  const pages: CSSProperties = { background: 'repeating-linear-gradient(180deg,#e2d6bc 0 4px,#c3b69b 4px 5px,#e7dcc4 5px 8px)', boxShadow: 'inset 0 3px 5px rgba(50,35,15,.2)' }
  return (
    <Group x={x} y={y} z={z} ry={ry}>
      <Box w={w - 10} h={30} d={220} faces={{ front: pages, right: pages, left: { background: cover } }} />
      <Box y={-17} w={w} h={4} d={230} faces={{ front: { background: cover }, top: cloth, right: { background: cover } }} />
      <Box y={17} w={w} h={4} d={230} faces={{ front: { background: cover }, top: cloth, right: { background: cover } }} />
    </Group>
  )
}

/** Shallow ceramic vessel; stacked horizontal sections give the rim real depth. */
function Bowl({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <Group x={x} y={y} z={z}>
      <Plane y={1} w={220} h={180} rx={90} style={{ borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(35,25,15,.28),transparent 70%)' }} />
      {Array.from({ length: 9 }, (_, i) => {
        const w = 124 + Math.pow(i / 8, .65) * 82
        return <Plane key={i} y={-i * 5} w={w} h={w * .84} rx={90}
          style={{ borderRadius: '50%', background: i === 8 ? 'radial-gradient(ellipse at 42% 38%,#ddd1b9 0%,#e9dfca 55%,#b9ac92 78%,#f4ead6 81%,#d0c2a8 95%)' : `linear-gradient(110deg,#e5d9c1,${i < 3 ? '#b9aa8e' : '#d0c1a6'})`, boxShadow: i === 8 ? 'inset 0 0 0 2px rgba(255,248,225,.75)' : undefined }} />
      })}
    </Group>
  )
}
