// Hand-authored garment illustrations. Flat, quiet, with fabric-true colour —
// they should read as real clothes at a glance, not as icons.

export type HangingKind = 'shirt' | 'tee' | 'knit' | 'jacket' | 'coat' | 'stripe'

const COLORS: Record<HangingKind, { base: string; shade: string; line: string }> = {
  shirt: { base: '#9db9d6', shade: '#7f9fc1', line: 'rgba(40,60,90,.25)' },
  tee: { base: '#f3efe7', shade: '#ddd6ca', line: 'rgba(80,70,60,.18)' },
  knit: { base: '#8d8a84', shade: '#75726c', line: 'rgba(30,30,30,.22)' },
  jacket: { base: '#5f82a8', shade: '#4a6a8f', line: 'rgba(214,160,90,.75)' },
  coat: { base: '#b98d5c', shade: '#9d7547', line: 'rgba(60,40,20,.28)' },
  stripe: { base: '#f4f2ee', shade: '#dedad2', line: 'rgba(40,60,110,.55)' },
}

function Hanger() {
  return (
    <g fill="none" stroke="#6b6157" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M110 30 c0 -12 14 -14 14 -24 c0 -8 -6 -12 -13 -12" />
      <path d="M110 30 L36 70 L184 70 Z" stroke="#7a6e62" />
    </g>
  )
}

export function HangingGarment({ kind, width = 220 }: { kind: HangingKind; width?: number }) {
  const c = COLORS[kind]
  const long = kind === 'coat'
  const h = long ? 760 : 620
  const id = `g-${kind}`
  return (
    <svg viewBox={`0 -10 220 ${h}`} width={width} height={(width / 220) * (h + 10)} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-sh`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".22" />
          <stop offset=".25" stopColor="#000" stopOpacity="0" />
          <stop offset=".7" stopColor="#fff" stopOpacity=".06" />
          <stop offset="1" stopColor="#000" stopOpacity=".2" />
        </linearGradient>
        <linearGradient id={`${id}-v`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".18" />
          <stop offset=".15" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".12" />
        </linearGradient>
        {kind === 'stripe' && (
          <pattern id={`${id}-p`} width="14" height="10" patternUnits="userSpaceOnUse">
            <rect width="14" height="10" fill={c.base} />
            <rect width="3" height="10" fill="#4d6596" opacity=".7" />
          </pattern>
        )}
        {kind === 'knit' && (
          <pattern id={`${id}-p`} width="8" height="9" patternUnits="userSpaceOnUse">
            <rect width="8" height="9" fill={c.base} />
            <path d="M0 0 L4 5 L8 0" stroke="#000" strokeOpacity=".09" fill="none" />
          </pattern>
        )}
      </defs>
      <Hanger />
      <g>{shape(kind, c, id)}</g>
    </svg>
  )
}

function shape(kind: HangingKind, c: (typeof COLORS)[HangingKind], id: string) {
  const fill = kind === 'stripe' || kind === 'knit' ? `url(#${id}-p)` : c.base
  const overlay = (d: string) => (
    <>
      <path d={d} fill={fill} />
      <path d={d} fill={`url(#${id}-sh)`} />
      <path d={d} fill={`url(#${id}-v)`} />
    </>
  )
  switch (kind) {
    case 'tee': {
      const d = 'M78 64 Q110 84 142 64 L190 84 L214 182 L176 196 L170 160 L172 560 Q110 568 48 560 L50 160 L44 196 L6 182 L30 84 Z'
      return (
        <>
          {overlay(d)}
          <path d="M78 64 Q110 92 142 64" fill="none" stroke={c.shade} strokeWidth="6" />
          <path d="M50 160 L52 520 M170 160 L168 520" stroke={c.line} strokeWidth="1.5" />
        </>
      )
    }
    case 'knit': {
      const d = 'M80 64 Q110 86 140 64 L194 86 L212 520 L176 526 L170 170 L174 548 Q110 556 46 548 L50 170 L44 526 L8 520 L26 86 Z'
      return (
        <>
          {overlay(d)}
          <path d="M80 64 Q110 94 140 64" fill="none" stroke={c.shade} strokeWidth="9" />
          <path d="M46 530 L174 530 M10 500 L46 504 M210 500 L176 504" stroke={c.shade} strokeWidth="18" opacity=".7" />
        </>
      )
    }
    case 'jacket': {
      const d = 'M74 62 L110 120 L146 62 L198 88 L214 500 L178 506 L172 180 L176 470 L44 470 L48 180 L42 506 L6 500 L22 88 Z'
      return (
        <>
          {overlay(d)}
          <path d="M74 62 L96 150 L110 120 Z M146 62 L124 150 L110 120 Z" fill={c.shade} />
          <rect x="58" y="190" width="40" height="34" rx="4" fill="none" stroke={c.line} strokeWidth="2" strokeDasharray="4 3" />
          <rect x="122" y="190" width="40" height="34" rx="4" fill="none" stroke={c.line} strokeWidth="2" strokeDasharray="4 3" />
          <path d="M110 130 L110 470" stroke={c.shade} strokeWidth="3" />
          {[170, 250, 330, 410].map((y) => (
            <circle key={y} cx="116" cy={y} r="4" fill="#c79b5e" />
          ))}
          <path d="M44 420 L176 420" stroke={c.line} strokeWidth="2" strokeDasharray="4 3" />
          <path d="M6 470 L42 474 M214 470 L178 474" stroke={c.shade} strokeWidth="10" />
        </>
      )
    }
    case 'coat': {
      const d = 'M74 62 L110 150 L146 62 L198 90 L212 560 L178 566 L172 190 L180 730 L40 730 L48 190 L42 566 L8 560 L22 90 Z'
      return (
        <>
          {overlay(d)}
          <path d="M74 62 L90 220 L110 150 Z M146 62 L130 220 L110 150 Z" fill={c.shade} />
          <path d="M110 150 L112 730" stroke={c.shade} strokeWidth="3" />
          <circle cx="122" cy="320" r="6" fill="#5a4026" />
          <circle cx="122" cy="420" r="6" fill="#5a4026" />
          <path d="M60 470 L94 470 M126 470 L160 470" stroke={c.line} strokeWidth="3" />
        </>
      )
    }
    default: {
      // button-down shirt — 'shirt' (linen) and 'stripe'
      const d = 'M76 62 Q110 80 144 62 L196 86 L212 540 L178 546 L170 184 L172 566 Q110 600 48 566 L50 184 L42 546 L8 540 L24 86 Z'
      return (
        <>
          {overlay(d)}
          <path d="M76 62 L104 104 L110 78 Z M144 62 L116 104 L110 78 Z" fill={kind === 'shirt' ? c.shade : '#fff'} stroke={c.line} strokeWidth="1.5" />
          <path d="M110 80 L110 580" stroke={c.line} strokeWidth="1.5" />
          {[140, 220, 300, 380, 460].map((y) => (
            <circle key={y} cx="114" cy={y} r="3" fill="#f6f2ea" stroke={c.line} />
          ))}
          <path d="M10 520 L42 524 M210 520 L178 524" stroke={c.shade} strokeWidth="14" />
          {kind === 'shirt' && (
            <path d="M60 140 Q66 300 58 480 M160 150 Q152 320 162 500" stroke="#fff" strokeOpacity=".14" strokeWidth="6" fill="none" />
          )}
        </>
      )
    }
  }
}

export function FoldedStack({ color, count = 1, width = 300 }: { color: string; count?: number; width?: number }) {
  return (
    <svg viewBox="0 0 300 64" width={width} height={(width / 300) * 64 * count} style={{ display: 'block' }} preserveAspectRatio="none">
      <rect x="4" y="6" width="292" height="54" rx="10" fill={color} />
      <rect x="4" y="6" width="292" height="54" rx="10" fill="url(#fold-sh)" />
      <path d="M150 10 L150 56" stroke="#000" strokeOpacity=".18" strokeWidth="2" />
      <path d="M12 14 L288 14" stroke="#fff" strokeOpacity=".16" strokeWidth="3" />
      <defs>
        <linearGradient id="fold-sh" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".12" />
          <stop offset="1" stopColor="#000" stopOpacity=".28" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function ShoePair({ kind, width = 320 }: { kind: 'sneaker' | 'boot' | 'loafer'; width?: number }) {
  const body = kind === 'sneaker' ? '#f6f4f0' : kind === 'boot' ? '#5a3b26' : '#2c2622'
  const sole = kind === 'sneaker' ? '#e3ded6' : '#2a1d14'
  const one = (x: number) =>
    kind === 'boot' ? (
      <g transform={`translate(${x} 0)`}>
        <path d="M18 8 L70 8 L72 70 Q120 74 136 96 L136 108 L10 108 Z" fill={body} />
        <path d="M10 102 L136 102 L136 112 L10 112 Z" fill={sole} />
        <path d="M30 14 L30 64" stroke="#000" strokeOpacity=".2" strokeWidth="6" />
      </g>
    ) : (
      <g transform={`translate(${x} 0)`}>
        <path d={kind === 'sneaker' ? 'M10 60 Q14 40 40 40 L66 40 Q96 60 132 72 Q142 78 140 98 L10 98 Z' : 'M10 66 Q20 50 44 50 L74 54 Q110 68 134 80 Q142 86 140 98 L10 98 Z'} fill={body} />
        <path d="M8 94 L142 94 L142 106 L8 106 Z" fill={sole} />
        {kind === 'sneaker' && <path d="M50 46 L76 64 M58 42 L84 60" stroke="#c9c3b9" strokeWidth="3" />}
      </g>
    )
  return (
    <svg viewBox="0 0 300 116" width={width} height={(width / 300) * 116} style={{ display: 'block' }}>
      {one(0)}
      {one(150)}
    </svg>
  )
}
