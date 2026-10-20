import { input } from '../engine/input'
import { cameraView, panoramaMode } from './camera'

/** World faces use one camera, then become independently projected 2D surfaces.
 * Chrome must never depth-sort a forest of intersecting preserve-3d layers.
 * Geometry and anchors remain spatial; only compositing is flattened. */
export type Face = { el: HTMLElement; world: DOMMatrix; w: number; h: number; layer: number; order: number; last: string; z: number }
export const worldFaces = new Set<Face>()
const faces = worldFaces
let serial = 0
let revision = 0
let lastView = ''
export function registerFace(el: HTMLElement, world: DOMMatrix, w: number, h: number, layer: number) {
  const face: Face = { el, world, w, h, layer, order: serial++, last: '', z: -1 }
  faces.add(face)
  revision++
  return () => { faces.delete(face); revision++ }
}

const P = 1000
export function projectWorld() {
  const { yaw, pitch } = input.head
  const eye = panoramaMode ? { x:0,y:0,z:0 } : input.eye
  const W = innerWidth, H = innerHeight
  const key = `${yaw.toFixed(3)}|${pitch.toFixed(3)}|${eye.x.toFixed(2)}|${eye.y.toFixed(2)}|${eye.z.toFixed(2)}|${W}|${H}|${revision}`
  if (key === lastView) return
  lastView = key
  const scale = Math.max(W / 1600, H / 900)
  const cx = W / 2, cy = H / 2
  const view = cameraView()
  const sorted: { face: Face; depth: number }[] = []
  for (const face of faces) {
    if (face.w && face.h && !face.el.dataset.target && !face.el.querySelector('[data-world-anchor]')) continue
    const q = view.multiply(face.world)
    const mx = face.w / 2, my = face.h / 2
    const x = q.m11 * mx + q.m21 * my + q.m41
    const y = q.m12 * mx + q.m22 * my + q.m42
    const z = q.m13 * mx + q.m23 * my + q.m43
    const facing = q.m31 * x + q.m32 * y + q.m33 * z < 0
    const visible = !face.w || !face.h || facing
    face.el.style.visibility = visible ? 'visible' : 'hidden'
    if (!visible) continue
    const ax = -q.m13 / P, ay = -q.m23 / P, aw = -q.m43 / P
    const values = [scale*q.m11+cx*ax, scale*q.m12+cy*ax, 0, ax,
      scale*q.m21+cx*ay, scale*q.m22+cy*ay, 0, ay,
      0, 0, 1, 0, scale*q.m41+cx*aw, scale*q.m42+cy*aw, 0, aw]
    const transform = `matrix3d(${values.map(n => Number(n.toFixed(7))).join(',')})`
    if (transform !== face.last) { face.el.style.transform = transform; face.last = transform }
    sorted.push({ face, depth: z })
  }
  sorted.sort((a,b) => a.face.layer - b.face.layer || a.depth-b.depth || a.face.order-b.face.order)
  sorted.forEach(({face}, i) => {
    if (face.z !== i) { face.el.style.zIndex = String(i); face.z = i }
  })
}
