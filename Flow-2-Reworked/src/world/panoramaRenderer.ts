import { input } from '../engine/input'
import { photoFrame, PHOTO } from './camera'

/** One photographic environment, projected with the same camera as its targets. */
export function createPanoramaRenderer(canvas:HTMLCanvasElement,onReady:()=>void) {
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'})!
 if(!gl)throw Error('WebGL is unavailable')
 const program=gl.createProgram()!
 const shaders:WebGLShader[]=[]
 for(const [type,source] of [[gl.VERTEX_SHADER,'attribute vec2 a; varying vec2 uv; void main(){uv=a;gl_Position=vec4(a*2.-1.,0.,1.);}'],[gl.FRAGMENT_SHADER,`precision highp float; varying vec2 uv; uniform vec2 viewport; uniform vec4 frame; uniform sampler2D photo;
 void main(){vec2 pixel=vec2(uv.x,1.-uv.y)*viewport;vec2 p=(pixel-frame.xy)/frame.zw;gl_FragColor=texture2D(photo,p);}`]] as [number,string][]) {
  const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader)
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader)??'Panorama shader failed')
  gl.attachShader(program,shader);shaders.push(shader)
 }
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Panorama link failed')
 const buffer=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW)
 gl.useProgram(program);const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0)
 const viewport=gl.getUniformLocation(program,'viewport'),frame=gl.getUniformLocation(program,'frame')
 const texture=gl.createTexture()!;let loaded=false,disposed=false,last=''
 const image=new Image();image.src=PHOTO.url
 image.decode().then(()=>{
  if(disposed)return
  gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image)
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
  loaded=true;onReady()
 }).catch(error=>console.error('Photographic room could not load',error))
 return {render(){
  if(!loaded||disposed)return
  const W=innerWidth,H=innerHeight,dpr=Math.min(devicePixelRatio,2)
  const key=`${W}|${H}|${input.head.yaw.toFixed(3)}|${input.head.pitch.toFixed(3)}`;if(last===key)return;last=key
  if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr)}gl.viewport(0,0,canvas.width,canvas.height)
  gl.useProgram(program);gl.uniform2f(viewport,W,H);const f=photoFrame();gl.uniform4f(frame,f.left,f.top,f.width,f.height);gl.bindTexture(gl.TEXTURE_2D,texture);gl.drawArrays(gl.TRIANGLES,0,6)
 },dispose(){disposed=true;gl.deleteTexture(texture);gl.deleteBuffer(buffer);for(const s of shaders)gl.deleteShader(s);gl.deleteProgram(program)}}
}
