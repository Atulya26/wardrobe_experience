import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useFrame } from '../engine/hooks'
import { projectWorld } from './projection'
import { createWorldRenderer } from './renderer'
import { createPanoramaRenderer } from './panoramaRenderer'
import { panoramaMode } from './camera'

export const STAGE_W = 1600
export const STAGE_H = 900
export const PERSPECTIVE = 1000
export const STAND = { x: 0, y: 0, z: 300 }

export function Scene({ children, onReady }: { children: ReactNode; onReady: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const readyCallback = useRef(onReady)
  readyCallback.current = onReady
  const renderer = useRef<ReturnType<typeof createWorldRenderer> | null>(null)
  useLayoutEffect(() => {
    const element = canvas.current!
    let active = true
    const start = () => {
      renderer.current = (panoramaMode ? createPanoramaRenderer : createWorldRenderer)(element, () => {
        if (!active) return
        document.documentElement.dataset.sceneReady = 'true'
        readyCallback.current()
      })
    }
    const lost = (event: Event) => {
      event.preventDefault()
      document.documentElement.dataset.sceneReady = 'false'
      renderer.current?.dispose()
      renderer.current = null
    }
    const restored = () => { if (active) start() }
    element.addEventListener('webglcontextlost', lost)
    element.addEventListener('webglcontextrestored', restored)
    start()
    return () => {
      active = false
      element.removeEventListener('webglcontextlost', lost)
      element.removeEventListener('webglcontextrestored', restored)
      renderer.current?.dispose()
      renderer.current = null
    }
  }, [])
  useFrame(() => {
    const began = performance.now()
    projectWorld(); renderer.current?.render()
    if (import.meta.env.DEV) {
      const debug = window as unknown as { __sceneCosts?: number[] }
      const costs = debug.__sceneCosts ??= []
      costs.push(performance.now() - began)
      if (costs.length > 600) costs.shift()
    }
  }, 'view')
  return <div className="layer world-scene" style={{ overflow: 'hidden', isolation: 'isolate', background: '#c7bdac' }}>
    <canvas ref={canvas} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    <div style={{ opacity: 0, pointerEvents: 'none' }}>{children}</div>
  </div>
}
