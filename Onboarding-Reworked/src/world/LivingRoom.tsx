import { useRef } from 'react'
import { useAnchor, useFrame, useTarget } from '../engine/hooks'
import { useLens } from '../state/store'
import { photoFrame, photoScreenPoint } from './camera'

// Stable semantic IDs retain the onboarding event contract; labels describe this room.
const PLACES:Record<string,[number,number]>={front:[.5,.48],'front-high':[.5,.32],window:[.215,.32],dresser:[.105,.57],wardrobe:[.52,.52],mirror:[.93,.38],floor:[.53,.79],phone:[.156,.542]}
function PhotoAnchor({name,at}:{name:string;at:[number,number]}){
 const ref=useAnchor<HTMLDivElement>(name)
 useFrame(()=>{const el=ref.current;if(!el)return;const q=photoScreenPoint(...at);el.style.transform=`translate3d(${q.x}px,${q.y}px,0)`},'view')
 return <div ref={ref} style={{position:'fixed',left:0,top:0,width:0,height:0}}/>
}
function PhoneTarget(){
 const stage=useLens(s=>s.stage)
 const ref=useTarget<HTMLDivElement>('phone',{dwellMs:700,pad:46,iris:stage===4,focusField:true,depth:2500,enabled:stage>=4,quiet:stage!==4})
 useFrame(()=>{const el=ref.current;if(!el)return;const q=photoScreenPoint(.156,.542);el.style.transform=`translate3d(${Math.max(18,q.x)-28}px,${q.y-12}px,0)`},'view')
 return <div ref={ref} style={{position:'fixed',left:0,top:0,width:56,height:24}}/>
}
/** DOM anchors are measured but the room itself is a single photographic canvas. */
export function LivingRoom(){return <>{Object.entries(PLACES).map(([name,at])=><PhotoAnchor key={name} name={name} at={at}/>)}<PhoneTarget/></>}
export function RoomScan(){
 const ref=useRef<HTMLDivElement>(null)
 useFrame(()=>{const el=ref.current;if(!el)return;const f=photoFrame();el.style.width=`${f.width}px`;el.style.height=`${f.height}px`;el.style.transform=`translate3d(${f.left}px,${f.top}px,0)`},'view')
 return <div ref={ref} className="photo-scan" aria-hidden="true"/>
}
