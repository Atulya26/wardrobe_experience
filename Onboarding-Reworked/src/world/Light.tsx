import { Plane } from './primitives'

// One sun for the whole room: ~29° elevation, coming through the left window,
// travelling into the room (+x) and slightly toward the wearer (+z).
// The floor patch is ray-traced offline (window panes, mullions, dresser and
// wardrobe shadows); leaf dapple and dust move on top so the light feels alive.
export const SUN = { x: 1, y: 0.56, z: 0.2 }

const WINDOW_X = -2592

/** Baked floor patch + moving leaf shadow, clipped to the patch itself. */
export function SunPatch() {
  return (
    <Plane x={100} y={1597} z={-1200} w={4600} h={2400} rx={90} res={2} className="sun-patch">
      <div style={{ position: 'absolute', inset: 0, background: "url('/assets/realism/sun-floor.webp') center / 100% 100% no-repeat" }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          WebkitMaskImage: "url('/assets/realism/sun-floor.webp')",
          maskImage: "url('/assets/realism/sun-floor.webp')",
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          overflow: 'hidden',
        }}
      >
        <div className="dapple anim" />
      </div>
    </Plane>
  )
}

/** A soft warm bounce where the sun patch lights the ceiling and the right wall. */
export function Bounce() {
  return (
    <>
      <Plane x={300} y={-1098} z={-1300} w={3800} h={2600} rx={-90} res={4}
        style={{ background: 'radial-gradient(50% 50% at 50% 55%, rgba(255,236,206,.28), transparent 70%)' }} />
      <Plane x={2596} y={900} z={-1500} w={2400} h={1600} ry={-90} res={4}
        style={{ background: 'radial-gradient(50% 50% at 55% 70%, rgba(255,232,198,.18), transparent 72%)' }} />
    </>
  )
}

// deterministic pseudo-random so the dust is the same every load
function rand(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Dust drifting in the beam between the upper panes and the floor. */
export function Dust({ count = 26 }: { count?: number }) {
  const motes = Array.from({ length: count }, (_, i) => {
    const y = -700 + rand(i) * 620
    const z = -2350 + rand(i + 50) * 1000
    const t = (1600 - y) / SUN.y
    const s = 0.18 + rand(i + 100) * 0.7
    return {
      x: WINDOW_X + s * t * SUN.x,
      y: y + s * t * SUN.y,
      z: z + s * t * SUN.z,
      size: 3 + rand(i + 150) * 4,
      dur: 9 + rand(i + 200) * 10,
      delay: -rand(i + 250) * 18,
      drift: i % 3,
    }
  })
  return (
    <>
      {motes.map((m, i) => (
        <Plane key={i} x={m.x} y={m.y} z={m.z} w={m.size} h={m.size}>
          <div
            className={`mote anim mote-${m.drift}`}
            style={{ width: m.size, height: m.size, marginLeft: -m.size / 2, marginTop: -m.size / 2, animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }}
          />
        </Plane>
      ))}
    </>
  )
}

/** Sheer curtain edges over the photographed curtains, stirring in a draught. */
export function Curtains() {
  return (
    <>
      {/* only over the photographed curtains, inside the frame */}
      <Plane x={WINDOW_X + 10} y={60} z={-1190} w={170} h={1640} ry={90}>
        <div className="sheer anim" />
      </Plane>
      <Plane x={WINDOW_X + 10} y={60} z={-2515} w={150} h={1640} ry={90}>
        <div className="sheer anim" style={{ animationDelay: '-3.4s', animationDuration: '8.6s' }} />
      </Plane>
    </>
  )
}
