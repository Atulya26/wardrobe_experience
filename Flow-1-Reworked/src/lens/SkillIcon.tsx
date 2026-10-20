export type SkillName = 'Look' | 'Reach' | 'Pinch' | 'Speak' | 'Zoom' | 'Swipe'
const symbols: Record<SkillName, string> = {
  Look: 'eye', Reach: 'hand.point.up.left', Pinch: 'hand.pinch',
  Speak: 'mic', Zoom: 'arrow.up.left.and.arrow.down.right', Swipe: 'hand.draw',
}

/** Native SF Symbols, rendered from AppKit at medium weight for this Mac prototype. */
export function SymbolIcon({ name, size = 24 }: { name: string; size?: number }) {
  return <span className="sf-symbol" aria-hidden="true" style={{ display: 'inline-block', flexShrink: 0, width: size, height: size, background: 'currentColor', mask: `url('/assets/symbols/${name}.png') center / contain no-repeat`, WebkitMask: `url('/assets/symbols/${name}.png') center / contain no-repeat` }} />
}
export function SkillIcon({ name, size = 28 }: { name: SkillName; size?: number }) {
  return <SymbolIcon name={symbols[name]} size={size} />
}
