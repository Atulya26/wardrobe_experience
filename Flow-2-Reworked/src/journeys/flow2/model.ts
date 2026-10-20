export type Phase='discover'|'detection'|'analysis'|'recommendation'|'adjustment'|'confirmed'|'compare'|'share-preview'|'sharing'|'reply'|'quiet'
export type Outfit='linen'|'denim'
export type Context={phase:Phase;outfit:Outfit;adjusted:boolean;saved:boolean;revision:number}
export type Event={type:'ATTEND'|'SCAN_DONE'|'ADVICE'|'ACCEPT'|'DECLINE'|'ADJUSTED'|'SAVE'|'COMPARE'|'CONTINUE'|'RESUME'|'RESTART'|'BACK'|'SHARE'|'SEND_SHARE'|'REPLY_RECEIVED'|'CLOSE_SHARE'}|{type:'CHOOSE';outfit:Outfit}
export const initial:Context={phase:'discover',outfit:'linen',adjusted:false,saved:false,revision:0}
export function transition(s:Context,e:Event):Context{
 const go=(phase:Phase,patch:Partial<Context>={})=>({...s,phase,...patch})
 switch(e.type){
 case 'RESTART':return {...initial,outfit:s.outfit,revision:s.revision+1}
 case 'ATTEND':return s.phase==='discover'?go('detection'):s
 case 'SCAN_DONE':return s.phase==='detection'?go('analysis'):s
 case 'ADVICE':return s.phase==='analysis'?go('recommendation'):s
 case 'ACCEPT':return s.phase==='recommendation'?go('adjustment'):s
 case 'DECLINE':return s.phase==='recommendation'||s.phase==='adjustment'?go('confirmed',{adjusted:false}):s
 case 'ADJUSTED':return s.phase==='adjustment'?go('confirmed',{adjusted:true}):s
 case 'SAVE':return s.phase==='confirmed'?go('confirmed',{saved:true}):s
 case 'COMPARE':return s.phase==='confirmed'?go('compare'):s
 case 'CHOOSE':return s.phase==='compare'?go('detection',{outfit:e.outfit,adjusted:false,saved:false,revision:s.revision+1}):s
 case 'BACK':return s.phase==='compare'?go('confirmed'):s
 case 'SHARE':return s.phase==='confirmed'?go('share-preview'):s
 case 'SEND_SHARE':return s.phase==='share-preview'?go('sharing'):s
 case 'REPLY_RECEIVED':return s.phase==='sharing'?go('reply'):s
 case 'CLOSE_SHARE':return ['share-preview','sharing','reply'].includes(s.phase)?go('confirmed'):s
 case 'CONTINUE':return s.phase==='confirmed'?go('quiet'):s
 case 'RESUME':return s.phase==='quiet'?go('confirmed'):s
 default:return s
 }
}
