import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useLens } from '../../state/store'
import { useFrame, useInput, useTarget } from '../../engine/hooks'
import { getTargetRect, onTargetEvent } from '../../engine/targets'
import { recenterView } from '../../engine/input'
import { sound } from '../../engine/sound'
import { Anchored, EdgeCue } from '../../lens/Anchored'
import { Guide } from '../../lens/ui'
import { SymbolIcon } from '../../lens/SkillIcon'
import { useFlow1 } from './store'
import { outfitById, rankedOutfits, type Flow1State, type OutfitId } from './model'
import { Action } from './Action'
import { OutfitFigure } from './OutfitFigure'
import { Preview } from './Preview'
import './flow1.css'
import { WardrobeDiscovery, OutfitReasoning } from './Thinking'
import { panoramaMode, wardrobeScreenPolygon } from '../../world/camera'

const durations: Partial<Record<Flow1State,number>>={'wardrobe-scan':9,'wardrobe-auto-detection':2.5,'ai-analysis':10.5}
export function Flow1({ready}:{ready:boolean}){
 const flow=useFlow1();const {state,send}=flow
 const attended=useLens(s=>s.attended)
 const [engaged,setEngaged]=useState(false),[phase,setPhase]=useState(0),[found,setFound]=useState(0),[assets,setAssets]=useState<'loading'|'ready'|'fallback'>('loading'),[unavailable,setUnavailable]=useState<OutfitId[]>([])
 const progress=useRef({revision:-1,value:0,phase:0}),bar=useRef<HTMLDivElement>(null),scan=useRef<HTMLDivElement>(null)
 const active=attended==='wardrobe'||!!attended?.startsWith('f1-')
 useEffect(()=>{let valid=true;Promise.allSettled(['outfit-views','custom-1','custom-2','custom-3','cotton-sneakers','cotton-boots','olive-sneakers','olive-boots'].map(name=>{const img=new Image();img.src=`/assets/flow1/${name}.png`;return img.decode()})).then(results=>{if(!valid)return;setAssets(results.slice(0,4).some(r=>r.status==='rejected')?'fallback':'ready');setUnavailable([...(results.slice(4,6).some(r=>r.status==='rejected')?['cotton-tee' as const]:[]),...(results.slice(6,8).some(r=>r.status==='rejected')?['olive-overshirt' as const]:[])])});return()=>{valid=false}},[])

 useEffect(()=>{if(active){setEngaged(true);return}const timer=setTimeout(()=>setEngaged(false),900);return()=>clearTimeout(timer)},[active])
 useEffect(()=>onTargetEvent(e=>{if(e.type==='select'&&e.id==='wardrobe'&&useFlow1.getState().state==='quiet')send({type:'RESUME'})}),[send])
 useEffect(()=>{progress.current={revision:flow.revision,value:0,phase:0};setPhase(0);document.documentElement.dataset.flow1State=state;if(state==='wardrobe-scan'){setFound(0);sound.scan()};if(state==='confirmed')sound.success();return()=>{delete document.documentElement.dataset.flow1State}},[state,flow.revision])
 useFrame(dt=>{const duration=durations[state],p=progress.current;if(duration&&ready&&engaged&&document.visibilityState==='visible'&&p.revision===flow.revision){p.value=Math.min(1,p.value+dt/duration);if(state==='wardrobe-scan'){const n=Math.min(8,Math.floor(p.value*8));setFound(old=>old===n?old:n)}const index=Math.min(2,Math.floor(p.value*3));if(index!==p.phase){p.phase=index;setPhase(index)}bar.current?.style.setProperty('--progress',String(p.value));scan.current?.style.setProperty('--scan-progress',String(p.value));if(p.value>=1)send({type:state==='wardrobe-scan'?'SCAN_COMPLETED':state==='wardrobe-auto-detection'?'DETECTION_COMPLETED':'ANALYSIS_COMPLETED',revision:p.revision})}if(scan.current){const r=getTargetRect('wardrobe');if(r)Object.assign(scan.current.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});if(r&&panoramaMode){const points=wardrobeScreenPolygon();scan.current.style.clipPath=`polygon(${points.map(p=>`${p.x-r.left}px ${p.y-r.top}px`).join(',')})`}}})
 useInput('escape',({reason})=>{if(reason&&reason!=='escape'||useLens.getState().showHelp||document.querySelector(':popover-open'))return;if(state==='wardrobe-tryon')return;if(durations[state])send({type:'RESTART'});else if(state!=='quiet')send({type:'QUIET'})})
 if(!ready)return <div className="f1-loading" role="status">Opening your dressing room…</div>
 const shown=(engaged||state==='confirmed')&&state!=='quiet',process=!!durations[state],recommend=state==='wardrobe-recommendations',preview=state==='wardrobe-tryon'
 return <>
  <div className="f1-status" data-chrome><button popoverTarget="f1-about">Wardrobe <span>·</span> Preview</button></div>
  <div id="f1-about" popover="auto" className="f1-about" data-chrome><h2>Your wardrobe companion</h2><p>Move the mouse to look. Click or Enter to pinch. Hold Space to reach. V is optional voice.</p><p>This is an illustrative wardrobe and outfit preview. Recognition, weather and wear history are simulated.</p><button popoverTarget="f1-about" popoverTargetAction="hide">Got it</button></div>
  {state==='wardrobe-scan'&&<div ref={scan} className="f1-scan-window" aria-hidden style={{opacity:engaged?1:0}}><div className="f1-scan-beam"/></div>}
  <div className="f1-layer" data-state={state}>
   <EdgeCue to="wardrobe" active={!engaged&&state!=='quiet'}/>
   {shown&&!preview&&!recommend&&state!=='confirmed'&&<Anchored to={process?'f1-analysis':'f1-wardrobe'}><ContextSurface rich={process}>
    <div className="f1-eyebrow">Your wardrobe</div>
    {state==='discover'&&<><h1>Start with your wardrobe.</h1><p>Scan your clothes to find a look for today.</p><div className="f1-actions"><Action id="f1-start" primary onSelect={()=>send({type:'START_SCAN'})}>Scan wardrobe</Action><Action id="f1-later" onSelect={()=>send({type:'QUIET'})}>Not now</Action></div></>}
    {process&&<>
     {state==='ai-analysis'?<OutfitReasoning phase={phase} occasion={flow.occasion}/>:<WardrobeDiscovery found={found} complete={state==='wardrobe-auto-detection'}/>}
     <div ref={bar} className="f1-progress" aria-label="Recognition in progress" role="img"><i/></div>
     <div className="f1-process-footer"><span>{state==='ai-analysis'?'Based on sample wear history':'Illustrative recognition'}</span><Action id="f1-cancel-process" onSelect={()=>send({type:'RESTART'})}>Cancel</Action></div>
    </>}
    {state==='wardrobe-user-confirmation'&&<><h1>What’s the plan?</h1><p>Choose once. We’ll find four looks for the day.</p><div className="f1-occasion-choices" role="group" aria-label="Today’s plans"><Action id="f1-everyday" onSelect={()=>send({type:'OCCASION_SELECTED',occasion:'everyday'})}>Everyday</Action><Action id="f1-outdoors" onSelect={()=>send({type:'OCCASION_SELECTED',occasion:'outdoors'})}>Outdoors</Action></div></>}

   </ContextSurface></Anchored>}
   {shown&&recommend&&<>
    <Anchored to="f1-recommend-heading"><div className="f1-recommend-heading"><div className="f1-eyebrow">{flow.occasion==='outdoors'?'For stepping out':'For your everyday'}</div><h1>Four ways to make it yours.</h1><p>Look at a style, then pinch to try. Every piece can be changed.</p></div></Anchored>
    {rankedOutfits(flow.occasion).map((id,slot)=><Recommendation key={id} id={id} slot={slot} loading={assets==='loading'} fallback={assets==='fallback'} unavailable={unavailable.includes(id)}/>)}
   </>}
   {shown&&(preview||state==='confirmed')&&<Preview confirmed={state==='confirmed'} fallback={assets==='fallback'} unavailable={unavailable}/>}
   {state==='quiet'&&engaged&&<Anchored to="f1-wardrobe"><Action id="f1-resume" onSelect={()=>send({type:'RESUME'})}>{flow.saved?'Your chosen look':'Wardrobe companion'}</Action></Anchored>}
  </div>
  {!engaged&&state!=='quiet'&&state!=='confirmed'&&<Guide id="f1-return" line={process?'Your wardrobe is waiting.':'Look left, toward your wardrobe.'} hint={process?'Look back to continue.':'Move the mouse to look · R to recenter'}/>}
  <div className="f1-presenter f1-presenter-reset" data-chrome><button aria-label="Restart flow" title="Restart flow" onClick={()=>{send({type:'RESTART'});recenterView()}}><SymbolIcon name="arrow.counterclockwise" size={20}/></button></div>
 </>
}
export function ContextSurface({children,compact=false,rich=false}:{children:ReactNode;compact?:boolean;rich?:boolean}){
 const reduce=useLens(s=>s.reduceMotion),ref=useTarget<HTMLElement>('f1-context-area',{priority:2,quiet:true,hand:false,pad:0})
 return <motion.section ref={ref} className={`f1-surface f1-context ${compact?'is-compact':''} ${rich?'is-rich':''}`} aria-label="Wardrobe companion" initial={{opacity:0,y:reduce?0:8}} animate={{opacity:1,y:0}} transition={{duration:.2}}>{children}</motion.section>
}
function Recommendation({id,slot,loading,fallback,unavailable}:{id:OutfitId;slot:number;loading:boolean;fallback:boolean;unavailable:boolean}){
 const o=outfitById(id),send=useFlow1(s=>s.send),holder=useRef<HTMLDivElement>(null)
 const target=useTarget<HTMLDivElement>(`f1-card-${id}`,{priority:3,hand:true,iris:true,dwellMs:500,enabled:!loading&&!unavailable,onSelect:()=>send({type:'OUTFIT_SELECTED',outfitId:id})})
 useFrame(()=>{if(holder.current){const h=Math.min(innerHeight*.43,480);holder.current.style.height=`${h}px`;holder.current.style.width=`${h*.546}px`}})
 return <Anchored to={`f1-recommend-${slot}`} origin="bottom"><div ref={holder} className="f1-recommend-model"><div ref={target} className="f1-recommend-body" data-outfit={id}><div className="f1-floor-shadow"/>{fallback&&(id==='blue-linen'||id==='denim-jacket')?<img src={`/assets/flow1/${o.image}`} alt={o.top}/>:!unavailable?<OutfitFigure outfit={id}/>:<div className="f1-asset-unavailable">Preview unavailable</div>}</div><div className="f1-model-caption"><div className="f1-look-title">{o.title}</div><Action id={`f1-outfit-${id}`} primary disabled={loading||unavailable} onSelect={()=>send({type:'OUTFIT_SELECTED',outfitId:id})}>{loading?'Preparing…':unavailable?'Unavailable':'Try this look'}</Action></div></div></Anchored>
}
