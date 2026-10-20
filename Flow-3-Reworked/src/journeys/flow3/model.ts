import type { ItemId,PreviewId } from './catalogue'
export type Phase='store-mode'|'clothing-recognition'|'confirmation'|'browsing'|'virtual-tryon'|'result'|'compare'|'decision'|'share-preview'|'shared'|'quiet'
type Simple='STORE_RECOGNISED'|'ITEM_RECOGNISED'|'ACCEPT_TRYON'|'DECLINE_TRYON'|'ITEM_FOCUSED'|'EVALUATION_COMPLETE'|'SAVE'|'COMPARE'|'SHARE'|'SEND_SIMULATED'|'BACK'|'CONTINUE'|'RESTART'|'IGNORE'|'RESUME'|'REPLY_RECEIVED'|'BROWSE'|'ADD_SHORTLIST'|'KEEP_OWNED'
export type Event={type:Simple}|{type:'FOCUS_ITEM'|'REMOVE_SHORTLIST';itemId:ItemId}|{type:'VIEW_COMPARISON'|'PREFER';itemId:PreviewId}
export type Context={phase:Phase;garmentId:ItemId;saved:boolean;savedIds:ItemId[];inspected:ItemId[];tried:ItemId[];shortlist:ItemId[];comparisonId:PreviewId;preferredId:PreviewId|null;sharedItemId:PreviewId|null;returnPhase:'result'|'decision';replyReceived:boolean;revision:number}
export const initial:Context={phase:'store-mode',garmentId:'premium-cotton-tee',saved:false,savedIds:[],inspected:[],tried:[],shortlist:[],comparisonId:'premium-cotton-tee',preferredId:null,sharedItemId:null,returnPhase:'result',replyReceived:false,revision:0}
const add=(list:ItemId[],id:ItemId)=>list.includes(id)?list:[...list,id]
export function transition(s:Context,e:Event):Context{
 const go=(phase:Phase,patch:Partial<Context>={})=>({...s,phase,...patch})
 switch(e.type){
 case 'RESTART':return {...initial,savedIds:s.savedIds,revision:s.revision+1}
 case 'FOCUS_ITEM':{
  if(['clothing-recognition','virtual-tryon','share-preview','shared'].includes(s.phase))return s
  const phase=s.tried.includes(e.itemId)?'result':s.inspected.includes(e.itemId)?'confirmation':'clothing-recognition'
  return go(phase,{garmentId:e.itemId,comparisonId:e.itemId,saved:s.savedIds.includes(e.itemId),revision:s.revision+1})
 }
 case 'STORE_RECOGNISED':return s.phase==='store-mode'?go('clothing-recognition'):s
 case 'ITEM_RECOGNISED':return s.phase==='clothing-recognition'?go('confirmation',{inspected:add(s.inspected,s.garmentId)}):s
 case 'ACCEPT_TRYON':return s.phase==='confirmation'?go(s.tried.includes(s.garmentId)?'result':'virtual-tryon'):s
 case 'DECLINE_TRYON':return s.phase==='confirmation'?go('browsing'):s
 case 'ITEM_FOCUSED':return s.phase==='browsing'?go(s.inspected.includes(s.garmentId)?'confirmation':'clothing-recognition'):s
 case 'EVALUATION_COMPLETE':return s.phase==='virtual-tryon'?go('result',{tried:add(s.tried,s.garmentId)}):s
 case 'SAVE':return ['result','decision'].includes(s.phase)&&!(s.phase==='decision'&&s.preferredId==='owned-linen')?go(s.phase,{saved:true,savedIds:add(s.savedIds,s.garmentId)}):s
 case 'ADD_SHORTLIST':return s.phase==='result'&&s.shortlist.length<3?go('result',{shortlist:add(s.shortlist,s.garmentId)}):s
 case 'REMOVE_SHORTLIST':return {...s,shortlist:s.shortlist.filter(id=>id!==e.itemId)}
 case 'COMPARE':return ['result','browsing','decision'].includes(s.phase)?go('compare',{comparisonId:s.preferredId??s.garmentId}):s
 case 'VIEW_COMPARISON':return s.phase==='compare'?go('compare',{comparisonId:e.itemId}):s
 case 'PREFER':return s.phase==='compare'?go('decision',{preferredId:e.itemId,...(e.itemId!=='owned-linen'?{garmentId:e.itemId,saved:s.savedIds.includes(e.itemId)}:{})}):s
 case 'KEEP_OWNED':return s.phase==='compare'?go('decision',{preferredId:'owned-linen'}):s
 case 'SHARE':return ['result','decision'].includes(s.phase)?go('share-preview',{returnPhase:s.phase as 'result'|'decision',sharedItemId:s.phase==='decision'?(s.preferredId??s.garmentId):s.garmentId,replyReceived:false}):s
 case 'SEND_SIMULATED':return s.phase==='share-preview'?go('shared'):s
 case 'REPLY_RECEIVED':return s.phase==='shared'?go('shared',{replyReceived:true}):s
 case 'BROWSE':return ['store-mode','result','decision','compare'].includes(s.phase)?go('browsing'):s
 case 'IGNORE':return s.phase==='store-mode'?go('quiet'):s
 case 'RESUME':return s.phase==='quiet'?go('browsing'):s
 case 'BACK':return ['share-preview','shared'].includes(s.phase)?go(s.returnPhase):s.phase==='compare'?go(s.tried.includes(s.garmentId)?'result':'browsing'):s
 case 'CONTINUE':return ['result','decision'].includes(s.phase)?go('quiet'):s
 default:return s
 }
}
export const SAMPLE_RESULT={size:'M',sleeves:'Slight adjustment',comfort:'Good',styleMatch:92,simulated:true} as const
