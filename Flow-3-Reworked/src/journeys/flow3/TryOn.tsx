import { useRef } from 'react'
import { useFrame,useTarget } from '../../engine/hooks'
import { useLens } from '../../state/store'
import { previewModel,previewName,type PreviewId } from './catalogue'
import { photoFrame } from '../../world/camera'
export const FIT_ZONES=[
 {id:'shoulders',name:'Shoulders',detail:'The shoulder line sits naturally in this sample preview.',rects:[[260,350,80,88],[595,347,82,88]]},
 {id:'chest',name:'Comfort',detail:'Good movement room through the chest. Illustrative, not a body measurement.',rects:[[325,475,278,120]]},
 {id:'sleeves',name:'Sleeves',detail:'A slight sleeve adjustment could sharpen the finish.',rects:[[202,535,100,67],[620,519,100,67]]},
] as const
export function TryOn({progress,scanning,itemId,onLoaded}:{progress:number;scanning:boolean;itemId:PreviewId;onLoaded:()=>void}){
 const root=useRef<HTMLDivElement>(null),attended=useLens(s=>s.attended)
 const src=previewModel(itemId),tee=itemId==='premium-cotton-tee'||itemId==='navy-cotton-tee'
 useFrame(()=>{const el=root.current;if(!el)return;const f=photoFrame(),h=f.height*.57;Object.assign(el.style,{left:`${f.left+f.width*.82-h*(875/1798)/2}px`,top:`${f.top+f.height*.22}px`,width:`${h*875/1798}px`,height:`${h}px`})},'view')
 return <div ref={root} className="tryon-person" data-tryon><div className="person-shadow"/><img src={src} alt={`Illustrative try-on: ${previewName(itemId)}`} onLoad={onLoaded}/>{scanning&&<div className="person-alpha-scan" style={{maskImage:`url('${src}')`,WebkitMaskImage:`url('${src}')`}}><i style={{top:`${2+progress*95}%`}}/></div>}{!scanning&&tee&&<><svg viewBox="0 0 875 1798" className="fit-regions" aria-hidden>{FIT_ZONES.map(z=><g key={z.id} className={`${z.id==='sleeves'?'warm':''} ${attended==='fit-'+z.id?'focused':''}`}>{z.rects.map(([x,y,width,height],i)=><rect key={i} x={x} y={y} width={width} height={height} rx="14"/>)}</g>)}</svg>{FIT_ZONES.map(z=><FitTarget key={z.id} zone={z}/>)}</>}</div>
}
function FitTarget({zone}:{zone:typeof FIT_ZONES[number]}){
 const [x,y,w,h]=zone.rects[0]
 const ref=useTarget<HTMLButtonElement>('fit-'+zone.id,{priority:2,hand:true,pad:8,quiet:true,onSelect:()=>{}})
 return <button ref={ref} className="fit-hit" style={{left:`${x/875*100}%`,top:`${y/1798*100}%`,width:`${w/875*100}%`,height:`${h/1798*100}%`}} aria-label={`${zone.name}: ${zone.detail}`}/>
}
