import { Plane } from './primitives'
import { panoramaMode } from './camera'
import { PhotoAnchor } from './PanoramaRoom'
import { useAnchor } from '../engine/hooks'

/** Named places in the wearer's space that the lens can attach things to. */
const POINTS: Record<string, [number, number, number]> = {
  front: [0, 140, -950],
  'front-high': [0, -120, -1100],
  'f1-wardrobe': [-1300, 120, -3500],
  'f1-preview': [900, 1600, -4800],
  'f1-controls': [-1500, 70, -3400],
  'f1-recommend-linen': [-500, 1600, -4800],
  'f1-recommend-denim': [1800, 1600, -4800],
}

const PHOTO_POINTS: Record<string,[number,number]> = {
 'f1-wardrobe':[.335,.64],
 'f1-analysis':[.335,.54],
 'f1-recommend-heading':[.54,.15],
 'f1-recommend-0':[.25,.72],
 'f1-recommend-1':[.43,.72],
 'f1-recommend-2':[.61,.72],
 'f1-recommend-3':[.79,.72],
 'f1-controls':[.21,.43],
 'f1-preview':[.64,.76],
 'f1-recommend-linen':[.50,.76],
 'f1-recommend-denim':[.72,.76],
}
function Point({ name, at }: { name: string; at: [number, number, number] }) {
  const ref = useAnchor<HTMLDivElement>(name)
  return <Plane ref={ref} x={at[0]} y={at[1]} z={at[2]} w={0} h={0} />
}
export function Points() {
 return <>{Object.entries(panoramaMode?{...POINTS,...Object.fromEntries(Object.keys(PHOTO_POINTS).map(k=>[k,[0,0,0] as [number,number,number]]))}:POINTS).map(([n,at])=>panoramaMode&&PHOTO_POINTS[n]
  ? <PhotoAnchor key={n} name={n} u={PHOTO_POINTS[n][0]} v={PHOTO_POINTS[n][1]}/>
  : <Point key={n} name={n} at={at}/>)}</>
}
