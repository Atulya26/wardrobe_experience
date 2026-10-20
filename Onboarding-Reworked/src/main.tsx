import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { startInput, input } from './engine/input'
import { useLens } from './state/store'
import { startTargets } from './engine/targets'
import { unlockAudio } from './engine/sound'
import { Scene } from './world/Scene'
import { prepareScene } from './world/assets'
import { Bedroom } from './world/Bedroom'
import { Points } from './world/Points'
import { LivingRoom, RoomScan } from './world/LivingRoom'
import { panoramaMode } from './world/camera'
import { FocusField } from './lens/FocusField'
import { Exposure } from './lens/Exposure'
import { Gaze } from './lens/Gaze'
import { Hand } from './lens/Hand'
import { VoiceCapsule } from './lens/ui'
import { Onboarding } from './journeys/onboarding/Onboarding'
import { Chrome } from './chrome/Chrome'
import './styles/global.css'

if (import.meta.env.DEV) import('./engine/diagnostics').then(({ startDiagnostics }) => startDiagnostics())

startInput()
startTargets()
if (import.meta.env.DEV) Object.assign(window, { __lens: { input, useLens } })

const sceneReady = panoramaMode ? Promise.resolve() : prepareScene()

function App() {
  const [ready, setReady] = useState(false)
  const [rendered, setRendered] = useState(false)
  useEffect(() => {
    let active = true
    sceneReady.then(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
  }, [])
  return (
    <>
      {ready && <Scene onReady={() => setRendered(true)}>
        {panoramaMode ? <LivingRoom /> : <><Bedroom /><Points /></>}
      </Scene>}
      {ready && !panoramaMode && <Exposure />}
      {ready && panoramaMode && <RoomScan />}
      <FocusField />
      <Onboarding ready={ready && rendered} />
      <Hand />
      <Hand side="left" />
      <Gaze />
      <VoiceCapsule />
      <Chrome />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
