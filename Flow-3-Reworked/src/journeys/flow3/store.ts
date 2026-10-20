import { create } from 'zustand'
import { initial, transition, type Context, type Event } from './model'
import { ITEM_IDS,type ItemId } from './catalogue'
let savedIds:ItemId[]=[]
try{const value=JSON.parse(localStorage.getItem('companion.store.saved-items')??'[]');if(Array.isArray(value))savedIds=ITEM_IDS.filter(id=>value.includes(id))}catch{}
export const useFlow3=create<Context & {send:(event:Event)=>void}>(set=>({...initial,savedIds,send:event=>set(state=>transition(state,event))}))
