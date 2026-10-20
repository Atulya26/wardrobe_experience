import { preload } from 'react-dom'

const sceneImages = ['walnut', 'plaster', 'oak-floor', 'window-graded', 'clothes', 'shoes', 'folded', 'plant', 'cotton', 'sun-floor', 'dapple']
let ready: Promise<void> | undefined

/** The reveal waits for decoded scene surfaces, not just completed downloads. */
export function prepareScene() {
  if (!ready) {
    ready = Promise.all(sceneImages.map(async (name) => {
      const url = `/assets/realism/${name}.webp`
      preload(url, { as: 'image' })
      const img = new Image()
      img.src = url
      try { await img.decode() }
      catch { console.warn(`Scene material unavailable: ${name}`) }
    })).then(() => undefined)
  }
  return ready
}
