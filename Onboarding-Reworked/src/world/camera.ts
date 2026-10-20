import { input } from '../engine/input'
export const panoramaMode = new URLSearchParams(location.search).get('room') !== 'geometry'
export const PHOTO = { url: '/assets/living-room/living-room.png', width: 1672, height: 941 }
/** Rectilinear image: uniform scaling and bounded panning, never spherical warping. */
export function photoFrame() {
 const W=innerWidth,H=innerHeight,aspect=PHOTO.width/PHOTO.height
 const height=Math.max(H,W/aspect)*1.025,width=height*aspect
 const mx=(width-W)/2,my=(height-H)/2
 const nx=Math.max(-1,Math.min(1,input.head.yaw/8)),ny=Math.max(-1,Math.min(1,input.head.pitch/7))
 return {left:-mx-nx*mx*.8,top:-my+ny*my*.8,width,height}
}
export function photoScreenPoint(u:number,v:number){const f=photoFrame();return {x:f.left+u*f.width,y:f.top+v*f.height}}
