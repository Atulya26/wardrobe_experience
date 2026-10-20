import { forwardRef, useId, type ReactNode } from 'react'

export type Fabric = 'linen' | 'denim' | 'cotton'
export const FABRICS: { id: Fabric; name: string; detail: string }[] = [
  { id: 'linen', name: 'Linen', detail: 'Slub weave · 160 gsm · breathable' },
  { id: 'denim', name: 'Denim', detail: '3×1 twill · 12 oz · indigo' },
  { id: 'cotton', name: 'Cotton', detail: 'Single jersey · 180 gsm · organic' },
]

/** Pinked edge: the zig-zag of a cut fabric sample. */
function pinked(w: number, h: number, t = 2) {
  const pts: string[] = []
  const step = t * 2
  for (let x = 0; x <= w; x += step) pts.push(`${x},${x % (step * 2) === 0 ? 0 : t}`)
  for (let y = 0; y <= h; y += step) pts.push(`${w - (y % (step * 2) === 0 ? 0 : t)},${y}`)
  for (let x = w; x >= 0; x -= step) pts.push(`${x},${h - (x % (step * 2) === 0 ? 0 : t)}`)
  for (let y = h; y >= 0; y -= step) pts.push(`${y % (step * 2) === 0 ? 0 : t},${y}`)
  return pts.join(' ')
}

export function FabricDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <pattern id="fab-linen" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#a7c0da" />
          <rect width="6" height="1.4" fill="#fff" opacity=".16" />
          <rect width="1.2" height="6" fill="#36557a" opacity=".12" />
        </pattern>
        <pattern id="fab-linen-slub" width="90" height="60" patternUnits="userSpaceOnUse">
          <rect x="4" y="12" width="40" height="1.6" fill="#fff" opacity=".22" rx=".8" />
          <rect x="50" y="38" width="30" height="1.8" fill="#fff" opacity=".18" rx=".9" />
          <rect x="18" y="52" width="22" height="1.4" fill="#2c4a70" opacity=".12" />
        </pattern>
        <pattern id="fab-denim" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-62)">
          <rect width="6" height="6" fill="#405e86" />
          <rect width="2.2" height="6" fill="#2d4669" />
          <rect x="3.5" width=".8" height="6" fill="#c9d6e6" opacity=".18" />
        </pattern>
        <pattern id="fab-cotton" width="4" height="5" patternUnits="userSpaceOnUse">
          <rect width="4" height="5" fill="#ebe3d5" />
          <path d="M0 0 L2 3 L4 0" stroke="#8a7a62" strokeOpacity=".16" fill="none" strokeWidth=".8" />
        </pattern>
        <linearGradient id="fab-shade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".2" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function FabricFace({ fabric, w = 150, h = 190 }: { fabric: Fabric; w?: number; h?: number }) {
  const pts = pinked(w, h)
  const clip = useId()
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs><clipPath id={clip}><polygon points={pts} /></clipPath></defs>
      {/* cut edge: the cloth has thickness */}
      <polygon points={pts} fill="#2a2018" opacity=".35" transform="translate(1.6 2.4)" />
      <polygon points={pts} fill="#000" opacity=".18" transform="translate(.8 1.2)" />
      <image href={`/assets/realism/${fabric}.webp`} width={w} height={h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clip})`} />
      <polygon points={pts} fill="url(#fab-shade)" />
      <polygon points={pts} fill="none" stroke="#000" strokeOpacity=".08" />
    </svg>
  )
}

type SwatchProps = { fabric: Fabric; liftable?: boolean; selected?: boolean; children?: ReactNode; style?: React.CSSProperties }
export const Swatch = forwardRef<HTMLDivElement, SwatchProps>(function Swatch({ fabric, liftable, selected, children, style }, ref) {
  const meta = FABRICS.find((f) => f.id === fabric)!
  return (
    <div ref={ref} className={`swatch${liftable ? ' liftable' : ''}`} style={style}>
      <div className="sw-body">
        <FabricFace fabric={fabric} w={124} h={156} />
        <div className="sw-sheen" />
        <div className="sw-touch" />
        {selected && (
          <div className="sw-badge">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M2.5 7.5 l3 3 l6 -7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      <div className="sw-label shadowed">{meta.name}</div>
      {children}
    </div>
  )
})
