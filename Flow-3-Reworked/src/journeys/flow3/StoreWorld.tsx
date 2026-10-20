import { useRef } from 'react'
import { useTarget,useFrame } from '../../engine/hooks'
import { photoFrame } from '../../world/camera'
import { useFlow3 } from './store'
import { useLens } from '../../state/store'
import { ITEM_IDS,ITEMS,money,type ItemId } from './catalogue'
export function StoreWorld({progress,ready}:{progress:number;ready:boolean}){
 const f=useFlow3(),attended=useLens(s=>s.attended),root=useRef<SVGSVGElement>(null),item=ITEMS[f.garmentId]
 useFrame(()=>{const frame=photoFrame();if(root.current){Object.assign(root.current.style,{width:`${frame.width}px`,height:`${frame.height}px`,transform:`translate3d(${frame.left}px,${frame.top}px,0)`})}},'view')
 return <>{ITEM_IDS.map(id=><RackItem key={id} id={id} ready={ready}/>)}<svg ref={root} className="store-map" viewBox="0 0 1672 941" aria-hidden><defs><clipPath id="rack-scan"><path d={item.trace}/></clipPath></defs>{ITEM_IDS.map(id=><path key={id} d={ITEMS[id].trace} className={`store-tee-outline ${attended==='rack-'+id||(f.phase==='clothing-recognition'&&id===f.garmentId)?'visible':''}`}/>)}{f.phase==='clothing-recognition'&&<g clipPath="url(#rack-scan)"><path d={`M${item.bounds[0]-5} ${item.bounds[1]+progress*item.bounds[3]} h${item.bounds[2]+10}`} className="store-scan-line"/></g>}</svg></>
}
function RackItem({id,ready}:{id:ItemId;ready:boolean}){
 const f=useFlow3(),item=ITEMS[id]
 const ref=useTarget<HTMLButtonElement>('rack-'+id,{enabled:ready&&!['clothing-recognition','virtual-tryon','share-preview','shared'].includes(f.phase),quiet:true,pad:4,priority:1,hand:true,onSelect:()=>f.send({type:'FOCUS_ITEM',itemId:id})})
 useFrame(()=>{const el=ref.current;if(!el)return;const f=photoFrame(),[x,y,w,h]=item.bounds;Object.assign(el.style,{left:`${f.left+x/1672*f.width}px`,top:`${f.top+y/941*f.height}px`,width:`${w/1672*f.width}px`,height:`${h/941*f.height}px`})},'view')
 return <button ref={ref} className="rack-item" aria-label={`Inspect ${item.name}, ${item.colour}, ${money(item.price)} sample price`}><span className="rack-label"><b>{item.short}</b><span>{money(item.price)} · pinch to inspect</span></span></button>
}
