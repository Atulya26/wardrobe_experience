import { useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useTarget, useFrame } from '../engine/hooks'
import { input } from '../engine/input'
import { photoScreenPoint } from '../world/camera'
import { SymbolIcon } from '../lens/SkillIcon'
export const cardPosition={manual:false,x:.32,y:.24}
export function Action({id,children,onSelect,primary=false,icon,label,disabled=false}:{id:string;children?:ReactNode;onSelect:()=>void;primary?:boolean;icon?:string;label?:string;disabled?:boolean}){
 const ref=useTarget<HTMLButtonElement>(id,{enabled:!disabled,priority:5,pad:5,dwellMs:180,hand:true,onSelect})
 return <button ref={ref} type="button" disabled={disabled} className={`s-action ${primary?'primary':''} ${!children?'icon-only':''}`} aria-label={label} title={label} onClick={e=>{if(e.currentTarget.closest('[data-chrome]')){onSelect();if(e.detail>0)e.currentTarget.blur()}else if(e.detail===0&&!input.pinching)onSelect()}}>{icon&&<SymbolIcon name={icon} size={20}/>} {children}</button>
}
function Handle(){
 const snapshot=useRef({...cardPosition})
 const ref=useTarget<HTMLButtonElement>('move-card',{priority:7,pad:7,quiet:true,hand:true,grab:{onGrab:()=>{snapshot.current={...cardPosition};const r=document.querySelector('[data-maincard]')!.getBoundingClientRect();Object.assign(cardPosition,{manual:true,x:r.left/innerWidth,y:r.top/innerHeight})},onDrag:(dx,dy)=>{cardPosition.x+=dx/innerWidth;cardPosition.y+=dy/innerHeight},onCancel:()=>Object.assign(cardPosition,snapshot.current)}})
 return <button ref={ref} className="s-handle" aria-label="Move card. Drag or use arrow keys while focused." title="Pinch and drag to move" onKeyDown={e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();e.stopPropagation();const r=document.querySelector('[data-maincard]')!.getBoundingClientRect();Object.assign(cardPosition,{manual:true,x:(r.left+(e.key==='ArrowRight'?20:e.key==='ArrowLeft'?-20:0))/innerWidth,y:(r.top+(e.key==='ArrowDown'?20:e.key==='ArrowUp'?-20:0))/innerHeight})}}><i/><i/><i/></button>
}
export function SpatialCard({children,title='Store companion',u=.62,v=.46,wide=false}:{children:ReactNode;title?:string;u?:number;v?:number;wide?:boolean}){
 const ref=useRef<HTMLDivElement>(null)
 useFrame(()=>{const el=ref.current;if(!el)return;const q=photoScreenPoint(u,v),w=el.offsetWidth,h=(el.firstElementChild as HTMLElement).offsetHeight*.75;el.style.height=`${h}px`;const x=Math.max(16,Math.min(innerWidth-w-16,cardPosition.manual?cardPosition.x*innerWidth:q.x-w/2));const y=Math.max(84,Math.min(innerHeight-h-32,cardPosition.manual?cardPosition.y*innerHeight:q.y-h/2));el.style.transform=`translate3d(${x}px,${y}px,0)`},'anchor')
 return <div ref={ref} data-maincard className={`s-place ${wide?'wide':''}`}><div className="s-scale"><motion.section className="s-card" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}}><header><span>{title}</span><Handle/></header>{children}</motion.section></div></div>
}
