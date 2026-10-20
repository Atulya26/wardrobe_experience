/**
 * The first thing that ever responds to you: a small glass bead floating in
 * the room. It is optical, not electronic — the world is seen through it,
 * slightly brightened and flipped (as a marble does), with a hard glint on the
 * window side and a caustic where it focuses the light on the far side.
 */
export function GlassBead({ size = 46 }: { size?: number }) {
  return (
    <span className="glass-bead anim" aria-hidden="true" style={{ width: size, height: size }}>
      <span className="gb-body" />
      <span className="gb-caustic" />
      <span className="gb-glint" />
    </span>
  )
}

/** A quiet ring of points for "connecting" — no orb, no particles. */
export function ConnectRing({ size = 40, color = 'var(--lens)' }: { size?: number; color?: string }) {
  const r = size * 0.36
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <circle key={i} cx={size / 2 + Math.cos(a) * r} cy={size / 2 + Math.sin(a) * r} r={size * 0.045} fill={color}>
            <animate attributeName="opacity" values="1;.15;1" dur="1.2s" begin={`${i * 0.1}s`} repeatCount="indefinite" />
          </circle>
        )
      })}
    </svg>
  )
}
