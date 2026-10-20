import { create } from 'zustand'
import { initialFlow1, transitionFlow1, type Flow1Context, type Flow1Event } from './model'
export const useFlow1 = create<Flow1Context & { send: (event: Flow1Event) => void }>((set) => ({
  ...initialFlow1,
  send: event => set(state => transitionFlow1(state, event)),
}))
