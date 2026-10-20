import { useAnchor, useTarget, useFrame } from '../engine/hooks'
import { photoScreenPoint, wardrobeScreenPolygon } from './camera'

export function PhotoAnchor({name,u,v}:{name:string;u:number;v:number}){
 const ref=useAnchor<HTMLDivElement>(name)
 useFrame(()=>{const p=photoScreenPoint(u,v);if(ref.current)Object.assign(ref.current.style,{left:`${p.x}px`,top:`${p.y}px`})},'view')
 return <div ref={ref} style={{position:'fixed',width:0,height:0}}/>
}
// Authored recognition region measured against the actual v3 source image.
export function PanoramaRoom(){
 const hit=useTarget<HTMLDivElement>('wardrobe',{priority:1,quiet:true,hand:false,pad:0,depth:5000})
 useFrame(()=>{
  const el=hit.current;if(!el)return
  const points=wardrobeScreenPolygon(),left=points[0].x,top=points[0].y,right=points[2].x,bottom=points[2].y
  Object.assign(el.style,{left:`${left}px`,top:`${top}px`,width:`${right-left}px`,height:`${bottom-top}px`})
 },'view')
 return <>
  <div ref={hit} style={{position:'fixed',pointerEvents:'none'}}/>
  <PhotoAnchor name="wardrobe" u={.334} v={.20}/>
  <PhotoAnchor name="mirror" u={.817} v={.4}/>
 </>
}
