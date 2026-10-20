import { input } from '../engine/input'

export const panoramaMode = new URLSearchParams(location.search).get('journey') !== 'onboarding' && new URLSearchParams(location.search).get('room') !== 'geometry'
export function cameraRotation() {
  return new DOMMatrix().rotateAxisAngle(1,0,0,input.head.pitch).rotateAxisAngle(0,1,0,input.head.yaw)
}
export function cameraView() {
  const e=input.eye
  return panoramaMode ? new DOMMatrix().translate(0,0,-300) : new DOMMatrix().translate(0,110,95).rotateAxisAngle(1,0,0,input.head.pitch).rotateAxisAngle(0,1,0,input.head.yaw).translate(-e.x,-110-e.y,-395-e.z)
}
// This source is a rectilinear photograph, not a spherical panorama. Bounded
// panning preserves its lines, aspect ratio and texture detail at every pose.
export const PHOTO={url:'/assets/flow1/panorama-exploration/dressing-room-v3.png',width:1672,height:941}
export const WARDROBE={left:.183,top:.198,right:.484,bottom:.585}
export function photoFrame(){
 const W=innerWidth,H=innerHeight,aspect=PHOTO.width/PHOTO.height
 const height=Math.max(H,W/aspect)*1.025,width=height*aspect
 const mx=(width-W)/2,my=(height-H)/2
 const nx=Math.max(-1,Math.min(1,input.head.yaw/8)),ny=Math.max(-1,Math.min(1,input.head.pitch/7))
 return {left:-mx-nx*mx*.8,top:-my+ny*my*.8,width,height}
}
export function photoScreenPoint(u:number,v:number){const f=photoFrame();return {x:f.left+u*f.width,y:f.top+v*f.height}}
export function wardrobeScreenPolygon(){
 const b=WARDROBE
 return [[b.left,b.top],[b.right,b.top],[b.right,b.bottom],[b.left,b.bottom]].map(([u,v])=>photoScreenPoint(u,v))
}
