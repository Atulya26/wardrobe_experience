import { useId } from 'react'
import base from './views.json'
import custom from './custom-views.json'
import extra from './extra-views.json'
const sheets = {...custom,...extra}
import { lookKey, lookNames, defaultLook, type OutfitId, type Look } from './model'
export const VIEW_NAMES = ['Front', 'Left side', 'Back', 'Right side']
const variants: Record<string, [keyof typeof sheets | 'base', number]> = {
  'cotton-jeans-sneakers':['cotton-sneakers',0], 'cotton-black-sneakers':['cotton-sneakers',1],
  'cotton-jeans-boots':['cotton-boots',0], 'cotton-black-boots':['cotton-boots',1],
  'olive-jeans-sneakers':['olive-sneakers',0], 'olive-black-sneakers':['olive-sneakers',1],
  'olive-jeans-boots':['olive-boots',0], 'olive-black-boots':['olive-boots',1],
  'linen-jeans-sneakers':['base',0], 'denim-black-boots':['base',1],
  'linen-jeans-boots':['custom-1',0], 'linen-black-sneakers':['custom-1',1],
  'linen-black-boots':['custom-2',0], 'denim-jeans-sneakers':['custom-2',1],
  'denim-jeans-boots':['custom-3',0], 'denim-black-sneakers':['custom-3',1],
}
export function OutfitFigure({ outfit, look, view = 0, className = '' }: { outfit: OutfitId; look?: Look; view?: number; className?: string }) {
  const selected = look ?? defaultLook(outfit)
  const [sheet, row] = variants[lookKey(selected)]
  const source = sheet === 'base' ? base : sheets[sheet]
  const [x,y,w,h] = source.frames[row*4+view]
  const crop = { x:x+w/2-h*.275, y:y-h*.004, w:h*.55, h:h*1.008 }
  const id=useId(); const names=lookNames(selected)
  return <svg className={`f1-figure ${className}`} viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`} role="img" aria-label={`${names.top}, ${names.bottom}, ${names.shoes}. ${VIEW_NAMES[view]} view.`} data-look={lookKey(selected)}>
    <defs><clipPath id={id}><rect x={crop.x} y={crop.y} width={crop.w} height={crop.h}/></clipPath></defs>
    <image href={`/assets/flow1/${sheet === 'base' ? 'outfit-views' : sheet}.png`} width={source.width} height={source.height} clipPath={`url(#${id})`}/>
  </svg>
}
