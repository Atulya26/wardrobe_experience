import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { startInput, input } from './engine/input'
import { startTargets } from './engine/targets'
import { unlockAudio } from './engine/sound'
import { useLens } from './state/store'
import { Scene } from './world/Scene'
import { Hand } from './lens/Hand'
import { Gaze } from './lens/Gaze'
import { VoiceCapsule } from './lens/ui'
import { FocusField } from './lens/FocusField'
import { Flow3 } from './journeys/flow3/Flow3'
import { useFlow3 } from './journeys/flow3/store'
import './styles/global.css'
import './journeys/flow3/flow3.css'
startInput();startTargets();useLens.getState().setStage(21)
input.range={yaw:8,pitch:7};input.breathe=false
if(import.meta.env.DEV)Object.assign(window,{__lens:{input,useLens},__flow3:useFlow3})
function App(){
 const [ready,setReady]=useState(false)
 useEffect(()=>{window.addEventListener('pointerdown',unlockAudio,{once:true});window.addEventListener('keydown',unlockAudio,{once:true});return()=>{window.removeEventListener('pointerdown',unlockAudio);window.removeEventListener('keydown',unlockAudio)}},[])
 return <><Scene onReady={()=>setReady(true)}><span/></Scene><FocusField/><Flow3 ready={ready}/><Hand/><Hand side="left"/><Gaze/><VoiceCapsule/></>
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>)
