import { input } from '../engine/input'
import { worldFaces, type Face } from './projection'

// Preserve the authored CSS materials as small, cached textures. One canvas
// owns visibility/depth, rather than Chrome's intersecting CSS compositor layers.
const imageData = new Map<string, Promise<string>>()
function inlineURL(url: string) {
  if (url.startsWith('data:')) return Promise.resolve(url)
  let pending = imageData.get(url)
  if (!pending) {
    pending = fetch(url).then(r => { if (!r.ok) throw Error(`Material ${url}: ${r.status}`); return r.blob() }).then(blob => new Promise<string>((resolve,reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob)
    }))
    imageData.set(url, pending)
  }
  return pending
}
async function inlineCSS(css: string) {
  const matches = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)]
  for (const match of matches) css = css.replace(match[0], `url("${await inlineURL(match[1])}")`)
  return css
}
async function faceImage(face: Face) {
  const clone = face.el.cloneNode(true) as HTMLElement
  const sources = [face.el, ...face.el.querySelectorAll('*')]
  const copies = [clone, ...clone.querySelectorAll('*')]
  await Promise.all(sources.map(async (source, i) => {
    const copy = copies[i] as HTMLElement
    const computed = getComputedStyle(source)
    // Copy visual properties; no stylesheets, URLs or fonts escape the texture.
    let css = ''
    for (const prop of computed) {
      if (prop.startsWith('--') || prop === 'transform' && i === 0 || prop === 'visibility' || prop === 'z-index') continue
      let value = computed.getPropertyValue(prop)
      if (value.includes('url(')) value = await inlineCSS(value)
      css += `${prop}:${value};`
    }
    copy.setAttribute('style', css + 'animation:none!important;transition:none!important;visibility:visible;')
    if (source instanceof HTMLImageElement) copy.setAttribute('src', await inlineURL(source.currentSrc || source.src))
  }))
  clone.style.cssText += `;position:relative;left:0;top:0;width:${face.w}px;height:${face.h}px;transform:none!important;opacity:1;`
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
  const ratio = Math.min(1, 1200 / Math.max(face.w, face.h))
  const width = Math.max(1, Math.ceil(face.w * ratio)), height = Math.max(1, Math.ceil(face.h * ratio))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${face.w} ${face.h}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(clone)}</foreignObject></svg>`
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  return img
}

type Surface = { opaque: boolean; translucent: boolean; matrix: Float32Array; face: Face; texture: WebGLTexture; dirty: boolean; busy: boolean; observer: MutationObserver }
export function createWorldRenderer(canvas: HTMLCanvasElement, onReady: () => void) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: true, powerPreference: 'high-performance' })
  if (!gl) throw Error('WebGL is unavailable in this browser')
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!; gl.shaderSource(s, source); gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s) ?? 'Scene shader failed')
    return s
  }
  const program = gl.createProgram()!
  const vert = shader(gl.VERTEX_SHADER, `attribute vec2 aPoint; uniform mat4 uWorld; uniform mat4 uView; uniform vec2 uSize; uniform vec2 uFocal; varying vec2 vUV;
    void main(){ vec4 v=uView*uWorld*vec4(aPoint*uSize,0.,1.); float depth=-v.z; gl_Position=vec4(v.x*uFocal.x,-v.y*uFocal.y,1.00004*depth-2.00004,depth); vUV=aPoint; }`)
  const frag = shader(gl.FRAGMENT_SHADER, `precision mediump float; uniform sampler2D uTexture; uniform int uPass; varying vec2 vUV; void main(){vec4 color=texture2D(uTexture,vUV);if(color.a<0.005)discard;if(uPass==0 && color.a<0.995)discard;if(uPass==1 && color.a>=0.995)discard;gl_FragColor=color;}`)
  gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program)
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error('Scene program failed')
  gl.useProgram(program)
  const buffer=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW)
  const point=gl.getAttribLocation(program,'aPoint');gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,2,gl.FLOAT,false,0,0)
  const world=gl.getUniformLocation(program,'uWorld'), viewUniform=gl.getUniformLocation(program,'uView'), size=gl.getUniformLocation(program,'uSize'), focal=gl.getUniformLocation(program,'uFocal')
  const passUniform=gl.getUniformLocation(program,'uPass')
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(.77,.73,.66,1)
  const surfaces = new Map<Face,Surface>()
  const bake = document.createElement('canvas')
  const bakeContext = bake.getContext('2d', { willReadFrequently: true })!
  let disposed=false, loading=0, ready=false, last=''
  const update = async (surface: Surface) => {
    surface.busy=true;surface.dirty=false;loading++
    try {
      const image=await faceImage(surface.face)
      if(disposed)return
      bake.width=image.width;bake.height=image.height
      bakeContext.drawImage(image,0,0)
      const pixels=bakeContext.getImageData(0,0,image.width,image.height).data
      surface.opaque=false;surface.translucent=false
      for(let i=3;i<pixels.length;i+=4){
        const alpha=pixels[i]
        if(alpha>=254)surface.opaque=true
        else if(alpha>1)surface.translucent=true
        if(surface.opaque&&surface.translucent)break
      }
      gl.bindTexture(gl.TEXTURE_2D,surface.texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false)
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image)
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
      last=''
    } catch(error) { console.error('Could not render scene material',error) }
    finally { surface.busy=false;loading-- }
  }
  const render = () => {
    if(disposed)return
    for(const face of worldFaces) {
      if(!face.w||!face.h||surfaces.has(face))continue
      const surface: Surface={opaque:false,translucent:false,matrix:face.world.toFloat32Array(),face,texture:gl.createTexture()!,dirty:true,busy:false,observer:new MutationObserver(()=>{surface.dirty=true})}
      // Ignore projected root transforms and gaze decoration; capture authored
      // content changes such as the phone display after a stage transition.
      surface.observer.observe(face.el,{childList:true,subtree:true,characterData:true})
      surfaces.set(face,surface)
    }
    for(const [face,surface] of surfaces)if(!worldFaces.has(face)){surface.observer.disconnect();gl.deleteTexture(surface.texture);surfaces.delete(face);last=''}
    for(const surface of surfaces.values())if(surface.dirty&&!surface.busy&&loading<6)void update(surface)
    if(!ready && surfaces.size && !loading && ![...surfaces.values()].some(s=>s.dirty)){ready=true;onReady()}
    const dpr=Math.min(devicePixelRatio,1.25)
    const W=innerWidth,H=innerHeight
    const width=Math.round(W*dpr),height=Math.round(H*dpr)
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);last=''}
    const {yaw,pitch}=input.head,e=input.eye
    const key=`${yaw.toFixed(3)}|${pitch.toFixed(3)}|${e.x.toFixed(2)}|${e.y.toFixed(2)}|${e.z.toFixed(2)}|${W}|${H}`
    if(key===last)return
    last=key
    const view=new DOMMatrix().translate(0,110,95).rotateAxisAngle(1,0,0,pitch).rotateAxisAngle(0,1,0,yaw).translate(-e.x,-110-e.y,-395-e.z)
    const scale=Math.max(W/1600,H/900)
    gl.useProgram(program);gl.uniform2f(focal,2000*scale/W,2000*scale/H);gl.uniformMatrix4fv(viewUniform,false,view.toFloat32Array())
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
    const ordered=[...surfaces.values()].filter(s=>!s.face.el.hidden).map(s=>({s,q:view.multiply(s.face.world)})).sort((a,b)=>(a.q.m13*a.s.face.w/2+a.q.m23*a.s.face.h/2+a.q.m43)-(b.q.m13*b.s.face.w/2+b.q.m23*b.s.face.h/2+b.q.m43))
    // Transparent light/shadow planes must never write depth: otherwise a
    // faint shadow can punch a hole through opaque furniture behind it.
    for (let pass=0;pass<2;pass++) {
      gl.uniform1i(passUniform,pass)
      gl.depthMask(pass===0)
      if(pass===0)gl.disable(gl.BLEND);else gl.enable(gl.BLEND)
      for(const {s,q} of ordered){
        if(pass===0 ? !s.opaque : !s.translucent)continue
        const f=s.face,x=q.m11*f.w/2+q.m21*f.h/2+q.m41,y=q.m12*f.w/2+q.m22*f.h/2+q.m42,z=q.m13*f.w/2+q.m23*f.h/2+q.m43
        if(q.m31*x+q.m32*y+q.m33*z>=0)continue
        gl.uniformMatrix4fv(world,false,s.matrix);gl.uniform2f(size,f.w,f.h);gl.bindTexture(gl.TEXTURE_2D,s.texture);gl.drawArrays(gl.TRIANGLES,0,6)
      }
    }
    gl.depthMask(true)
  }
  return {render,dispose(){disposed=true;for(const s of surfaces.values()){s.observer.disconnect();gl.deleteTexture(s.texture)}gl.deleteBuffer(buffer);gl.deleteShader(vert);gl.deleteShader(frag);gl.deleteProgram(program)}}
}
