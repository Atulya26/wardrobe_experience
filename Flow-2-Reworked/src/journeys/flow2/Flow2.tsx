import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFlow2 } from './store'
import { useLens } from '../../state/store'
import { useFrame, useTarget, useInput } from '../../engine/hooks'
import { input, recenterView } from '../../engine/input'
import { photoFrame, photoScreenPoint } from '../../world/camera'
import { SymbolIcon } from '../../lens/SkillIcon'
import { Guide, Kbd } from '../../lens/ui'
import { sound } from '../../engine/sound'
import type { Outfit } from './model'
import { BODY_IMAGE, BODY_MAP, BODY_PATCHES, type FitZone } from './bodyMap'

const NAMES={linen:'Blue linen shirt',denim:'Denim jacket'}
const ZONES=[
 {id:'shoulders',name:'Shoulders',verdict:'Perfect',detail:'The shoulder seams sit in line with your frame.',good:true},
 {id:'chest',name:'Chest',verdict:'Perfect',detail:'Comfortable room through the chest for everyday movement.',good:true},
 {id:'sleeves',name:'Sleeves',verdict:'Slightly long',detail:'A small cuff roll will give your hands a little more room.',good:false},
 {id:'waist',name:'Waist',verdict:'Ideal',detail:'A natural line at the waist without excess tightness.',good:true},
 {id:'cuff',name:'Pant cuff',verdict:'Needs adjustment',detail:'The hem could sit just above the shoe. This preview does not simulate tailoring.',good:false},
]
function Action({id,children,onSelect,primary=false,icon,label,dwell=false}:{id:string;children?:ReactNode;onSelect:()=>void;primary?:boolean;icon?:string;label?:string;dwell?:boolean}){
 const ref=useTarget<HTMLButtonElement>(id,{priority:4,pad:3,dwellMs:dwell?1100:180,iris:dwell,hand:true,onSelect,onSettle:dwell?onSelect:undefined})
 return <button ref={ref} className={`f2-action ${primary?'primary':''} ${!children?'icon-only':''}`} aria-label={label} title={label} onClick={e=>{if(e.currentTarget.closest('[data-chrome]')){onSelect();if(e.detail>0)e.currentTarget.blur()}else if(e.detail===0&&!input.pinching)onSelect()}}>{icon&&<SymbolIcon name={icon} size={20}/>} {children}</button>
}
// Normalized viewport placement persists across cards and resizes; dragging is direct.
const placement={manual:false,x:.25,y:.25}
function DragHandle(){
 const snapshot=useRef({...placement})
 const ref=useTarget<HTMLButtonElement>('move-card',{priority:7,pad:7,hand:true,quiet:true,grab:{
  onGrab:()=>{snapshot.current={...placement};const r=document.querySelector('[data-maincard]')!.getBoundingClientRect();Object.assign(placement,{manual:true,x:r.left/innerWidth,y:r.top/innerHeight})},
  onDrag:(dx,dy)=>{placement.x+=dx/innerWidth;placement.y+=dy/innerHeight},
  onCancel:()=>Object.assign(placement,snapshot.current),
 }})
 return <button ref={ref} className="f2-drag-handle" aria-label="Move card. Drag anywhere, or use arrow keys while focused." title="Pinch and drag to place anywhere" onKeyDown={e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();e.stopPropagation();const r=document.querySelector('[data-maincard]')!.getBoundingClientRect();Object.assign(placement,{manual:true,x:(r.left+(e.key==='ArrowRight'?20:e.key==='ArrowLeft'?-20:0))/innerWidth,y:(r.top+(e.key==='ArrowDown'?20:e.key==='ArrowUp'?-20:0))/innerHeight})}}><span/><span/><span/></button>
}
function Place({u,v,children,className='',style}:{u:number;v:number;children:ReactNode;className?:string;style?:CSSProperties}){
 const ref=useRef<HTMLDivElement>(null)
 useFrame(()=>{const el=ref.current;if(!el)return;const q=photoScreenPoint(u,v),w=el.offsetWidth,h=(el.firstElementChild as HTMLElement).offsetHeight*.75;el.style.height=`${h}px`;let x=placement.manual?placement.x*innerWidth:q.x-w/2,y=placement.manual?placement.y*innerHeight:q.y-h/2;x=Math.max(16,Math.min(innerWidth-16-w,x));y=Math.max(80,Math.min(innerHeight-24-h,y));el.style.transform=`translate3d(${x}px,${y}px,0)`},'anchor')
 return <div ref={ref} data-maincard className={`f2-place ${className}`} style={style}><div className="f2-card-scale">{children}</div></div>
}
function Card({children}:{children:ReactNode}){return <motion.section className="f2-card" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:.22}}>{children}</motion.section>}
function Reflection({scan}:{scan:number}){
 const f=useFlow2(),reduce=useLens(s=>s.reduceMotion)
 const root=useRef<HTMLDivElement>(null)
 const [pinned,setPinned]=useState<string|null>(null),attended=useLens(s=>s.attended)
 const activeZone=attended?.startsWith('zone-')?attended.slice(5):pinned
 const ref=useTarget<HTMLDivElement>('mirror',{enabled:f.phase==='discover'||f.phase==='quiet',priority:1,iris:true,dwellMs:900,onSettle:()=>f.send({type:f.phase==='quiet'?'RESUME':'ATTEND'}),onSelect:()=>f.send({type:f.phase==='quiet'?'RESUME':'ATTEND'})})
 useFrame(()=>{const el=root.current;if(!el)return;const frame=photoFrame();el.style.left=`${frame.left+frame.width*.69-frame.height*.55*(BODY_IMAGE.width/BODY_IMAGE.height)/2}px`;el.style.top=`${frame.top+frame.height*.225}px`;el.style.height=`${frame.height*.55}px`;el.style.width=`${frame.height*.55*(BODY_IMAGE.width/BODY_IMAGE.height)}px`},'view')
 const active=['analysis','recommendation','adjustment'].includes(f.phase)
 return <div ref={root} className="f2-reflection" data-reflection>
  <div ref={ref} className="f2-mirror-target"/>
  <div className="f2-foot-shadow"/>
  <img className="f2-person" src={`/assets/flow2/${f.outfit}-before.png`} alt={`Your simulated reflection in ${NAMES[f.outfit]}, ${f.outfit==='linen'?'dark jeans and white sneakers':'black pants and brown boots'}`} style={{opacity:f.adjusted?0:1}}/>
  <img className="f2-person" src={`/assets/flow2/${f.outfit}-after.png`} alt="" aria-hidden style={{opacity:f.adjusted?1:0}}/>
  {f.phase==='detection'&&<div className="f2-photo-scan" style={{maskImage:`url('/assets/flow2/${f.outfit}-before.png')`,WebkitMaskImage:`url('/assets/flow2/${f.outfit}-before.png')`}} aria-hidden="true"><div className="f2-scan-strip" style={{top:`${reduce?50:1.6+scan*95.8}%`}}/></div>}
  {active&&<svg className="f2-seam-map" viewBox={`0 0 ${BODY_IMAGE.width} ${BODY_IMAGE.height}`} aria-hidden="true">{ZONES.map(z=><g key={z.id} className={`${z.good?'good':'advice'} ${activeZone===z.id?'focused':''}`}><>{BODY_PATCHES[f.outfit][z.id as FitZone].map(([x,y,width,height],i)=><rect key={i} className="fit-patch" x={x} y={y} width={width} height={height} rx="13"/>)}</></g>)}</svg>}
  {active&&ZONES.map(z=><Zone key={z.id} zone={z} focused={activeZone===z.id} onPin={()=>setPinned(pinned===z.id?null:z.id)}/>)}
  {active&&activeZone&&<ZoneDetail zone={ZONES.find(z=>z.id===activeZone)!}/>}
  {f.phase==='adjustment'&&<CuffGesture/>}
 </div>
}
function Zone({zone:z,focused,onPin}:{zone:typeof ZONES[number];focused:boolean;onPin:()=>void}){
 const f=useFlow2()
 const ref=useTarget<HTMLButtonElement>('zone-'+z.id,{enabled:f.phase!=='adjustment',priority:2,pad:8,quiet:true,hand:true,onSelect:onPin})
 const [x,y,w,h]=BODY_MAP[f.outfit][z.id as FitZone].bounds
 return <button ref={ref} className={`f2-zone ${z.good?'good':'advice'} ${focused?'focused':''}`} style={{left:`${x/BODY_IMAGE.width*100}%`,top:`${y/BODY_IMAGE.height*100}%`,width:`${w/BODY_IMAGE.width*100}%`,height:`${h/BODY_IMAGE.height*100}%`}} aria-label={`${z.name}: ${z.verdict}`}/>

}
function ZoneDetail({zone:z}:{zone:typeof ZONES[number]}){
 const ref=useRef<HTMLDivElement>(null)
 useFrame(()=>{
  const el=ref.current,r=document.querySelector(`[data-target="zone-${z.id}"]`)?.getBoundingClientRect(),card=document.querySelector('[data-maincard]')?.getBoundingClientRect(),body=document.querySelector('[data-reflection]')?.getBoundingClientRect()
  if(!el||!r||!body)return
  const w=el.offsetWidth,h=el.offsetHeight,cy=r.top+r.height/2
  const candidates=[[r.left-w-20,cy-h/2],[body.right+20,cy-h/2],...(card?[[card.left-w-20,cy-h/2],[card.right+20,cy-h/2],[card.left,card.top-h-20],[card.left,card.bottom+20]]:[])]
  const overlap=(x:number,y:number,rect:DOMRect|undefined)=>rect?Math.max(0,Math.min(x+w,rect.right+12)-Math.max(x,rect.left-12))*Math.max(0,Math.min(y+h,rect.bottom+12)-Math.max(y,rect.top-12)):0
  const options=candidates.map(([x,y])=>({x:Math.max(16,Math.min(innerWidth-w-16,x)),y:Math.max(84,Math.min(innerHeight-h-24,y))}))
  options.sort((a,b)=>(overlap(a.x,a.y,card)*100+overlap(a.x,a.y,body)+Math.abs(a.y+h/2-cy)*.1)-(overlap(b.x,b.y,card)*100+overlap(b.x,b.y,body)+Math.abs(b.y+h/2-cy)*.1))
  el.style.transform=`translate3d(${options[0].x}px,${options[0].y}px,0)`
 },'anchor')
 return createPortal(<div ref={ref} className={`f2-zone-detail floating ${z.good?'good':'advice'}`}><span>{z.name}</span><strong>{z.verdict}</strong><p>{z.detail}</p></div>,document.body)
}
function CuffGesture(){
 const send=useFlow2(s=>s.send),drag=useRef(0),[progress,setProgress]=useState(0)
 const ref=useTarget<HTMLDivElement>('adjust-cuff',{priority:5,pad:12,hand:true,quiet:true,grab:{onGrab:()=>{drag.current=0},onDrag:(_dx,dy)=>{drag.current=Math.max(0,Math.min(1,drag.current-dy/85));setProgress(drag.current)},onRelease:()=>{if(drag.current>=.8)send({type:'ADJUSTED'});else{drag.current=0;setProgress(0)}},onCancel:()=>{drag.current=0;setProgress(0)}}})
 return <div ref={ref} className="f2-cuff-gesture" data-progress={progress} style={{bottom:`${44+progress*10}%`}}><span className="f2-cuff-arrow">↑</span><span>{progress>=.8?'Release':'Lift cuff'}</span><i style={{transform:`scaleX(${progress})`}}/></div>
}
export function Flow2({ready}:{ready:boolean}){
 const f=useFlow2(),reduce=useLens(s=>s.reduceMotion),[help,setHelp]=useState(false),[scan,setScan]=useState(0)
 const attended=useLens(s=>s.attended)
 const elapsed=useRef(0)
 useEffect(()=>{elapsed.current=0;setScan(0)},[f.phase,f.revision])
 useEffect(()=>{document.documentElement.dataset.reduce=String(reduce);input.breathe=false},[reduce])
 useFrame(dt=>{if(f.phase!=='detection'||!ready)return;const r=document.querySelector('[data-reflection]')?.getBoundingClientRect();if(!r)return;const looking=input.gaze.x>r.left-100&&input.gaze.x<r.right+100&&input.gaze.y>r.top&&input.gaze.y<r.bottom;if(looking){elapsed.current+=dt;setScan(Math.min(1,elapsed.current/4.5));if(elapsed.current>=4.5)f.send({type:'SCAN_DONE'})}})
 useInput('swipe',()=>{if(f.phase==='recommendation')f.send({type:'DECLINE'})})
 useInput('escape',()=>{if(f.phase==='adjustment')f.send({type:'DECLINE'});setHelp(false)})
 useEffect(()=>{if(f.phase==='confirmed')sound.success()},[f.phase])
 const save=()=>{try{localStorage.setItem('companion.saved-fit',JSON.stringify({outfit:f.outfit,adjusted:f.adjusted,simulated:true,savedAt:new Date().toISOString()}))}catch{}f.send({type:'SAVE'})}
 useEffect(()=>{if(f.phase!=='sharing')return;const revision=f.revision;const t=setTimeout(()=>{const current=useFlow2.getState();if(current.phase==='sharing'&&current.revision===revision)current.send({type:'REPLY_RECEIVED'})},3200);return()=>clearTimeout(t)},[f.phase,f.revision])
 const cardU=.40
 return <>
 <header className="f2-chrome" data-chrome><div className="f2-context">Mirror <span>·</span> Fit check</div><div className="f2-tools"><Action id="restart" icon="arrow.counterclockwise" label="Restart fit check" onSelect={()=>{placement.manual=false;recenterView();f.send({type:'RESTART'})}}/><Action id="recenter" icon="eye" label="Recenter view" onSelect={recenterView}/><Action id="settings" icon="slider.horizontal.3" label="Interaction help" onSelect={()=>setHelp(v=>!v)}/></div></header>
 {ready&&<Reflection scan={scan}/>}
 <AnimatePresence mode="wait">
 {ready&&f.phase!=='quiet'&&<Place key={f.phase+f.revision} u={cardU} v={.43} >
 <Card><div className="f2-card-top"><span>{f.phase==='confirmed'?'Your fit':'Your reflection'}</span><DragHandle/></div>
 {f.phase==='discover'&&<><h1>A moment in the mirror.</h1><p>Let’s see how your outfit sits.</p><Action id="begin-fit" primary onSelect={()=>f.send({type:'ATTEND'})}>Check my fit</Action></>}
 {f.phase==='detection'&&<><h1>Finding your fit.</h1><p>{scan<.35?'Finding your shoulders and neckline.':scan<.7?'Following the seams and sleeve length.':'Checking the waist and trouser break.'}</p><div className="f2-progress"><i style={{transform:`scaleX(${scan})`}}/></div><span className="f2-caption">Keep your eyes on your reflection.</span></>}
 {f.phase==='analysis'&&<><h1>Room to move.</h1><p>Shoulders, chest and waist sit well. Two details are worth a closer look.</p><div className="f2-fit-note"><b>Sleeves</b><span>Slightly long</span><b>Pant cuff</b><span>Needs adjustment</span></div><p className="f2-secondary">Look at a marker on your reflection for the detail.</p><Action id="see-advice" primary onSelect={()=>f.send({type:'ADVICE'})}>See the suggestion</Action></>}
 {f.phase==='recommendation'&&<><h1>A small sleeve roll.</h1><p>Roll your cuffs slightly to give your hands more room. Keep the rest as it is.</p><div className="f2-actions"><Action id="accept-advice" primary dwell onSelect={()=>f.send({type:'ACCEPT'})}>Guide me</Action><Action id="decline-advice" onSelect={()=>f.send({type:'DECLINE'})}>Keep it as is</Action></div><span className="f2-caption">Pinch to accept · swipe to dismiss · voice optional</span></>}
 {f.phase==='adjustment'&&<><h1>Just a little higher.</h1><p>Pinch the sleeve marker and lift it upward, then release.</p><p className="f2-secondary">The highlighted cuff is your hand target. Your view stays still while you drag.</p><Action id="adjust-accessible" primary onSelect={()=>f.send({type:'ADJUSTED'})}>Simulate cuff roll</Action><Action id="cancel-adjustment" onSelect={()=>f.send({type:'DECLINE'})}>Leave it as is</Action></>}
 {f.phase==='confirmed'&&<><div className="f2-confirm-mark"><SymbolIcon name="checkmark" size={26}/></div><h1>{f.adjusted?'A little change. A good fit.':'Your fit, your call.'}</h1><p>{NAMES[f.outfit]}. {f.adjusted?'Sleeves rolled, room to move.':'Sleeves kept as you like them.'}</p><p className="f2-secondary">The trouser hem is still worth checking in person.</p><Action id="share-mom" onSelect={()=>f.send({type:'SHARE'})}>Share with Mom</Action><Action id="save-outfit" primary onSelect={save}>{f.saved?'Outfit saved':'Save outfit'}</Action><div className="f2-actions"><Action id="compare-another" onSelect={()=>f.send({type:'COMPARE'})}>Compare another</Action><Action id="continue" onSelect={()=>f.send({type:'CONTINUE'})}>Continue</Action></div>{f.saved&&<span role="status" className="f2-caption">Saved on this browser · illustrative fit check</span>}</>}

 {['share-preview','sharing','reply'].includes(f.phase)&&<>
 <div className="f2-mom-heading"><div className="f2-mom-avatar">M</div><div><b>Mom</b><span>Private conversation · simulation</span></div></div>
 {f.phase==='share-preview'?<><h1>One more opinion?</h1><p>Share this look with Mom.</p><div className="f2-share-preview"><img src={`/assets/flow2/${f.outfit}-${f.adjusted?'after':'before'}.png`} alt={`Outfit preview: ${NAMES[f.outfit]}`}/><div><b>{NAMES[f.outfit]}</b><span>{f.adjusted?'Cuffs rolled':'As worn'} · today’s look</span></div></div><div className="f2-message outgoing">How does this look, Mom?</div><Action id="send-mom" primary onSelect={()=>f.send({type:'SEND_SHARE'})}>Send to Mom</Action><Action id="cancel-share" onSelect={()=>f.send({type:'CLOSE_SHARE'})}>Back to my fit</Action></>:<><h1>{f.phase==='reply'?'A little reassurance.':'Sent to Mom.'}</h1><div className="f2-chat-photo"><img src={`/assets/flow2/${f.outfit}-${f.adjusted?'after':'before'}.png`} alt="Shared outfit preview"/><span>How does this look, Mom?</span></div><div className="f2-delivery">{f.phase==='reply'?'Seen':'Delivered'} · simulated</div>{f.phase==='sharing'?<div className="f2-typing" role="status">Mom is typing<span>•••</span></div>:<div className="f2-message incoming" role="status">It’s perfect. You look lovely!<small>Mom · just now</small></div>}<Action id="share-done" primary onSelect={()=>f.send({type:'CLOSE_SHARE'})}>{f.phase==='reply'?'Back to my look':'Close conversation'}</Action></>}
 <span className="f2-caption">Demo conversation. Nothing is sent to a real person.</span>
 </>}
 {f.phase==='compare'&&<><h1>Another perspective.</h1><p>Bring another outfit into the same mirror check.</p><div className="f2-outfits">{(['linen','denim'] as Outfit[]).map(o=><div key={o}><img src={`/assets/flow2/${o}-before.png`} alt={NAMES[o]}/><Action id={'choose-'+o} primary={f.outfit===o} onSelect={()=>f.send({type:'CHOOSE',outfit:o})}>{o==='linen'?'Linen':'Denim'}</Action></div>)}</div><Action id="compare-back" onSelect={()=>f.send({type:'BACK'})}>Back to my fit</Action></>}
 </Card></Place>}
 </AnimatePresence>
 {f.phase==='quiet'&&attended==='mirror'&&<Place u={.38} v={.45}><Card><h1>Your look is ready.</h1><Action id="resume" primary onSelect={()=>f.send({type:'RESUME'})}>Revisit fit check</Action></Card></Place>}
 {f.phase==='discover'&&<Guide id="mirror-look" line={ready?'Look toward your reflection.':'Preparing your mirror…'} hint="Mouse = eyes · click / Enter = pinch · hold V = optional voice"/>}
 {f.phase==='adjustment'&&<Guide id="cuff-lift" inputMode="reach" line="Your hand makes the adjustment." hint={<>Click and drag the cuff upward · or focus “Simulate cuff roll” and press <Kbd>Enter</Kbd></>}/>}
 {f.phase==='quiet'&&<div className="f2-quiet-note" role="status">You’re ready. The mirror is yours again.</div>}
 <div className="f2-simulation">Illustrative fit · no body scan or measurements</div>
 {help&&<div className="f2-help" data-chrome role="dialog" aria-label="Mirror controls"><h2>Eyes focus. Hands act.</h2><p>Move the mouse to look. Click or Enter to pinch. Drag the cuff upward to adjust. Tab moves between actions. R recentres your view.</p><p>Hold V on an action, then release, to simulate a voice command. No microphone is used.</p><button onClick={()=>useLens.setState({reduceMotion:!reduce})}>{reduce?'Enable motion':'Reduce motion'}</button><button onClick={()=>setHelp(false)}>Done</button></div>}
 </>
}
