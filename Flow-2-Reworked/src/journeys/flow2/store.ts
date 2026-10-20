import { create } from 'zustand'
import { initial, transition, type Context, type Event } from './model'
const outfit=new URLSearchParams(location.search).get('outfit')==='denim'?'denim':'linen'
export const useFlow2=create<Context & {send:(e:Event)=>void}>((set)=>({...initial,outfit,send:e=>set(s=>transition(s,e))}))
