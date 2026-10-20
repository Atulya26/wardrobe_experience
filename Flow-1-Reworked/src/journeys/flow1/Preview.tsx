import { useEffect, useRef, useState } from 'react'
import { useFrame, useInput, useTarget, getAnchorRect } from '../../engine/hooks'
import { setGestureContext } from '../../engine/gestureFeedback'
import { useLens } from '../../state/store'
import { Anchored } from '../../lens/Anchored'
import { useFlow1 } from './store'
import { currentLook, lookKey, lookNames, defaultLook, OUTFITS, type OutfitId, type BottomId, type ShoeId } from './model'
import { Action } from './Action'
import { SymbolIcon } from '../../lens/SkillIcon'
import { OutfitFigure, VIEW_NAMES } from './OutfitFigure'

type Category='top'|'bottom'|'shoes'
export function Preview({fallback,unavailable=[],confirmed=false}:{fallback:boolean;unavailable?:OutfitId[];confirmed?:boolean}){
 const flow=useFlow1(),{selected,view,zoom,send}=flow,look=currentLook(flow),names=lookNames(look)
 const reduce=useLens(s=>s.reduceMotion),[category,setCategory]=useState<Category|null>(null),[side,setSide]=useState<'left'|'right'>('left')
 const panel=useTarget<HTMLElement>('f1-preview-panel',{priority:2,quiet:true,hand:false,pad:0})
 const holder=useRef<HTMLDivElement>(null),editorPosition=useRef<HTMLDivElement>(null),motion=useRef({height:0,drag:0,active:false,originView:view,cancelledAt:0})
 const placement=useRef({dx:0,dy:0,dragging:false,lastX:0,startDx:0,startDy:0})
 const moveHandle=useTarget<HTMLButtonElement>('f1-move-card',{priority:5,hand:true,pad:0,iris:true,grab:{
  onGrab:()=>{const p=placement.current;p.dragging=true;p.startDx=p.dx;p.startDy=p.dy},
  onDrag:(dx,dy)=>{placement.current.dx+=dx;placement.current.dy+=dy},
  onRelease:()=>{const p=placement.current,foot=getAnchorRect('f1-preview');p.dragging=false;if(foot)setSide(p.lastX>foot.left?'right':'left');p.dx=0},
  onCancel:()=>{const p=placement.current;p.dragging=false;p.dx=p.startDx;p.dy=p.startDy;motion.current.cancelledAt=performance.now()},
 }})
 const place=(next:'left'|'right')=>{placement.current.dx=0;placement.current.dy=0;setSide(next)}
 const target=useTarget<HTMLDivElement>('f1-preview-body',{priority:3,hand:!confirmed,iris:!confirmed,quiet:confirmed,dwellMs:220,depth:5000,grab:confirmed?undefined:{
  onGrab:()=>{const m=motion.current;m.active=true;m.drag=0;m.originView=useFlow1.getState().view},
  onDrag:dx=>{const m=motion.current;m.drag+=dx;if(!fallback&&Math.abs(m.drag)>65){send({type:'TURN',delta:m.drag>0?1:-1});m.drag=0}},
  onRelease:()=>{motion.current.active=false},
  onCancel:()=>{const m=motion.current;m.active=false;m.cancelledAt=performance.now();send({type:'TURN',delta:m.originView-useFlow1.getState().view})},
 }})
 useEffect(()=>setGestureContext(confirmed?null:{zoomTarget:'f1-preview-body',swipe:true}),[confirmed])
 useInput('zoom',({delta})=>send({type:'ZOOM',delta:delta*.5}),!confirmed)
 useInput('swipe',({dir})=>{if(!motion.current.active&&!fallback)send({type:'TURN',delta:dir})},!confirmed)
 useInput('escape',({reason})=>{if(confirmed)return;if(reason&&reason!=='escape'||useLens.getState().showHelp||document.querySelector(':popover-open'))return;if(performance.now()-motion.current.cancelledAt<80)return;if(placement.current.dragging)return;if(category){setCategory(null);return}send({type:'BACK'})})
 useFrame(dt=>{const foot=getAnchorRect('f1-preview'),available=(foot?.top??innerHeight*.85)-92,wanted=Math.min(innerHeight*.46*1.4*zoom,Math.max(240,available)),m=motion.current;if(!m.height||reduce)m.height=wanted;else m.height+=(wanted-m.height)*(1-Math.exp(-dt*18));if(holder.current){holder.current.style.height=`${m.height.toFixed(1)}px`;holder.current.style.width=`${(m.height*.546).toFixed(1)}px`}if(foot&&panel.current&&editorPosition.current){const r=panel.current.getBoundingClientRect(),p=placement.current,shift=side==='right'?Math.max(0,foot.left+m.height*.546/2+32+r.width-(innerWidth-24)):0,gutter=m.height*.546/2+32+r.width/2,baseX=foot.left-shift+(side==='left'?-gutter:gutter),x=Math.max(24+r.width/2,Math.min(innerWidth-24-r.width/2,baseX+p.dx)),y=Math.max(80+r.height/2,Math.min(innerHeight-100-r.height/2,foot.top-m.height/2+p.dy));if(holder.current)holder.current.style.transform=`translateX(${-shift}px)`;p.lastX=x;editorPosition.current.style.transform=`translate3d(${x}px,${y}px,0)`;editorPosition.current.dataset.side=side;holder.current?.style.setProperty('--toolbar-offset',`${Math.max(14,y+r.height/2-foot.top+16)}px`)}})
 const confirm=()=>{
  try{sessionStorage.setItem('companion.outfit',JSON.stringify({outfitId:selected,variantId:lookKey(look),...names,look,source:'flow1-customized-preview',simulated:true}))}catch{/* retain in the flow state */}
  send({type:'CONFIRM_OUTFIT'})
 }
 const custom=lookKey(look)!==lookKey(defaultLook(selected))
 return <>
  <div ref={editorPosition} className="f1-preview-editor-position"><section ref={panel} className="f1-surface f1-editor" aria-label="Customize your outfit" onWheel={event=>event.stopPropagation()}>
   <header className="f1-editor-header"><button ref={moveHandle} className="f1-card-grip" aria-label="Pinch and drag card" title="Pinch and drag to move" onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();event.stopPropagation();place(event.key==='ArrowLeft'?'left':'right')}}}><SymbolIcon name="hand.draw" size={17}/><span>Move card</span></button><div className="f1-header-actions"><Action id="f1-dock-left" label="Place card left of model" icon="chevron.left" active={side==='left'} onSelect={()=>place('left')}>{null}</Action><Action id="f1-dock-right" label="Place card right of model" icon="chevron.right" active={side==='right'} onSelect={()=>place('right')}>{null}</Action><Action id="f1-restore-look" label="Reset combination" icon="arrow.counterclockwise" disabled={confirmed||!custom} onSelect={()=>{send({type:'RESTORE_LOOK'});setCategory(null)}}>{null}</Action></div></header>
   {confirmed?<div className="f1-chosen-summary"><div className="f1-eyebrow">Your chosen look</div><h1>Made yours.</h1><p>{names.top}<br/>{names.bottom} · {names.shoes}</p><div className="f1-confirm-actions"><Action id="f1-finish" primary onSelect={()=>send({type:'QUIET'})}>Keep this look</Action><div className="f1-confirm-secondary"><Action id="f1-adjust-look" onSelect={()=>send({type:'ADJUST_LOOK'})}>Adjust</Action><Action id="f1-change-mind" onSelect={()=>send({type:'BACK'})}>Compare styles</Action></div></div></div>:category?<>

    <Action id="f1-edit-back" icon="chevron.left" onSelect={()=>setCategory(null)}>Your look</Action><h2>{category==='top'?'Choose a top':category==='bottom'?'Choose trousers':'Choose shoes'}</h2>
    {category==='top'&&<div className="f1-top-options">{OUTFITS.map(o=><Option key={o.id} id={o.id} name={o.top} disabled={unavailable.includes(o.id)} material={o.id==='olive-overshirt'?undefined:o.texture} color={o.id==='olive-overshirt'?'#74785d':undefined} active={selected===o.id} onSelect={()=>{send({type:'CUSTOMIZE_TOP',outfitId:o.id});setCategory(null)}}/>)}</div>}
    {category==='bottom'&&<><Option id="jeans" name="Dark jeans" material="denim" active={look.bottom==='jeans'} onSelect={()=>{send({type:'CUSTOMIZE_BOTTOM',bottom:'jeans'});setCategory(null)}}/><Option id="black" name="Black pants" color="#333638" active={look.bottom==='black'} onSelect={()=>{send({type:'CUSTOMIZE_BOTTOM',bottom:'black'});setCategory(null)}}/></>}
    {category==='shoes'&&<><Option id="sneakers" name="White sneakers" color="#ede9df" active={look.shoes==='sneakers'} onSelect={()=>{send({type:'CUSTOMIZE_SHOES',shoes:'sneakers'});setCategory(null)}}/><Option id="boots" name="Brown boots" color="#79503a" active={look.shoes==='boots'} onSelect={()=>{send({type:'CUSTOMIZE_SHOES',shoes:'boots'});setCategory(null)}}/></>}
   </>:<>
    <div className="f1-eyebrow">Your look</div><h1>Make it yours.</h1>
    <div className="f1-edit-pieces">
     <EditPiece category="top" name={names.top} disabled={fallback} onSelect={()=>setCategory('top')}/>
     <EditPiece category="bottom" name={names.bottom} disabled={fallback} onSelect={()=>setCategory('bottom')}/>
     <EditPiece category="shoes" name={names.shoes} disabled={fallback} onSelect={()=>setCategory('shoes')}/>
    </div>
    <Action id="f1-confirm-outfit" primary icon="checkmark" onSelect={confirm}>Choose this look</Action>
    <div className="f1-editor-secondary"><Action id="f1-back-to-options" onSelect={()=>send({type:'BACK'})}>Compare looks</Action></div>
    {fallback&&<p className="f1-detail-note">Front view available. Custom views couldn’t load.</p>}
   </>}
  </section></div>
  <Anchored to="f1-preview" origin="bottom"><div ref={holder} className="f1-human-stage">
   <div ref={target} className="f1-body-target" data-outfit={selected} data-look={lookKey(look)} data-view={view} data-zoom={zoom.toFixed(2)} aria-label={confirmed?'Your chosen outfit':'Drag to turn the outfit'} role="group"><div className="f1-floor-shadow"/><OutfitFigure outfit={selected} look={look} view={fallback?0:view}/></div>
   {!confirmed&&<div className="f1-surface f1-ornament" aria-label="Outfit view controls">
    <Action id="f1-turn-left" disabled={fallback} icon="chevron.left" onSelect={()=>send({type:'TURN',delta:-1})}>Turn</Action><span className="f1-view-name" aria-live="polite">{VIEW_NAMES[view]}</span><Action id="f1-turn-right" disabled={fallback} icon="chevron.right" onSelect={()=>send({type:'TURN',delta:1})}>Turn</Action><i/>
    <Action id="f1-zoom-out" disabled={zoom<=1} onSelect={()=>send({type:'ZOOM',delta:-.2})}>−</Action><span className="f1-zoom-value">{Math.round(zoom*100)}%</span><Action id="f1-zoom-in" disabled={zoom>=1.8} onSelect={()=>send({type:'ZOOM',delta:.2})}>+</Action><Action id="f1-reset-view" icon="arrow.counterclockwise" onSelect={()=>send({type:'RESET_VIEW'})}>Fit</Action>
   </div>}
  </div></Anchored>
 </>
}
function EditPiece({category,name,disabled,onSelect}:{category:Category;name:string;disabled:boolean;onSelect:()=>void}){
 return <Action id={`f1-piece-${category==='top'?'upper':category}`} className="f1-edit-piece" disabled={disabled} onSelect={onSelect}><span><small>{category==='top'?'Top':category==='bottom'?'Trousers':'Shoes'}</small><b>{name}</b></span><span aria-hidden>›</span></Action>
}
function Option({id,name,material,color,active,onSelect,disabled=false}:{id:OutfitId|BottomId|ShoeId;name:string;material?:string;color?:string;active:boolean;onSelect:()=>void;disabled?:boolean}){
 return <Action id={`f1-custom-${id}`} className="f1-option" disabled={disabled} active={active} onSelect={onSelect}><span className="f1-option-swatch" style={{background:material?`url('/assets/realism/${material}.webp') center/cover`:color}}/>{name}</Action>
}
