import { Plane } from './primitives'
import { useAnchor } from '../engine/hooks'

/** Named places in the wearer's space that the lens can attach things to. */
const POINTS: Record<string, [number, number, number]> = {
  front: [0, 140, -950],
  'front-high': [0, -120, -1100],
}

function Point({ name, at }: { name: string; at: [number, number, number] }) {
  const ref = useAnchor<HTMLDivElement>(name)
  return <Plane ref={ref} x={at[0]} y={at[1]} z={at[2]} w={0} h={0} />
}

export function Points() {
  return (
    <>
      {Object.entries(POINTS).map(([n, at]) => (
        <Point key={n} name={n} at={at} />
      ))}
    </>
  )
}
