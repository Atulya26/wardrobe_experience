import type { CSSProperties } from 'react'
import { Plane, Group, Box } from './primitives'
import { useAnchor, useTarget } from '../engine/hooks'

// A separate dressing suite. Eye height 1.6m, furniture and floor in millimetres.
const FLOOR = 1600, BACK = -6500, FRONT = 800, SIDE = 6500, CEIL = -2000
const wood = (shade = .08): CSSProperties => ({ backgroundImage: `linear-gradient(rgba(38,29,20,${shade}),rgba(38,29,20,${shade})),url('/assets/realism/walnut.webp')`, backgroundSize: '430px 1400px', boxShadow: 'inset 0 1px 0 rgba(255,245,220,.16)' })
const plaster: CSSProperties = { backgroundImage: "linear-gradient(#eee7dc55,#b9ae9f44),url('/assets/realism/plaster.webp')", backgroundSize: 'auto,700px 700px' }
const faces = { front: wood(), top: wood(.16), right: wood(.22), left: wood(.2) }

export function DressingRoom() {
  const wardrobe = useAnchor<HTMLDivElement>('wardrobe')
  const hit = useTarget<HTMLDivElement>('wardrobe', { priority: 1, quiet: true, hand: false, pad: 0, depth: 6000 })
  const window = useAnchor<HTMLDivElement>('window-pane')
  return <>
    <Plane y={FLOOR} z={(FRONT+BACK)/2} w={SIDE*2} h={FRONT-BACK} rx={90} style={{ backgroundImage: "linear-gradient(rgba(245,226,190,.12),rgba(58,42,26,.14)),url('/assets/realism/oak-floor.webp')", backgroundSize: 'auto,680px 680px' }} />
    <Plane y={CEIL} z={(FRONT+BACK)/2} w={SIDE*2} h={FRONT-BACK} rx={-90} style={{...plaster, backgroundColor:'#f3eee6'}} />
    <Plane y={(CEIL+FLOOR)/2} z={BACK} w={SIDE*2} h={FLOOR-CEIL} style={plaster} />
    <Plane x={-SIDE} y={(CEIL+FLOOR)/2} z={(BACK+FRONT)/2} w={FRONT-BACK} h={FLOOR-CEIL} ry={90} style={plaster} />
    <Plane x={SIDE} y={(CEIL+FLOOR)/2} z={(BACK+FRONT)/2} w={FRONT-BACK} h={FLOOR-CEIL} ry={-90} style={plaster} />
    <Plane y={FLOOR-55} z={BACK+5} w={SIDE*2} h={110} style={{background:'#e2d8c7',boxShadow:'inset 0 3px 0 #fff8ee'}} />
    <Plane y={CEIL+45} z={BACK+20} w={SIDE*2} h={90} style={{background:'linear-gradient(#c7bbab,#f6eee1)'}} />
    <Group x={-2400} z={BACK+90}>
      <Box y={200} z={330} w={4350} h={2800} d={660} faces={{front:wood(.4),top:wood(.2),right:wood(.25),left:wood(.25)}} />
      {[-1400,0,1400].map((x,i)=><WardrobeBay key={x} x={x} index={i} />)}
      <Plane ref={wardrobe} y={-1250} z={740} w={0} h={0} />
      <Plane ref={hit} y={120} z={750} w={4300} h={2800} style={{pointerEvents:'none'}} />
    </Group>
    {/* Recessed shelves establish depth and give the suite a lived-in collection. */}
    <Group x={-6150} z={-3400} ry={90}>
      <Box y={700} w={1700} h={1700} d={420} faces={{front:wood(.3),top:wood(.18),right:wood(.2)}} />
      {[50,560,1070].map((y,i)=><Group key={y} y={y}>
        <Plane y={-120} z={220} w={1560} h={320} style={{background:"url('/assets/realism/folded.webp') center / 100% 100% no-repeat",filter:`brightness(${.85+i*.04})`}} />
        <Box y={80} z={190} w={1640} h={32} d={350} faces={faces}/>
      </Group>)}
    </Group>
    <Group x={4400} z={BACK+35}>
      <Box y={-70} w={2300} h={2850} d={45} faces={{front:{background:'#d7c9b0'},right:{background:'#998975'}}}/>
      <Plane ref={window} y={-70} z={32} w={2190} h={2730} style={{background:"url('/assets/realism/window-graded.webp') center / cover",filter:'brightness(1.06) saturate(.82)'}}/>
      <Plane x={0} y={-70} z={48} w={40} h={2730} style={{background:'#e7decb'}}/>
      <Plane y={80} z={48} w={2190} h={35} style={{background:'#e7decb'}}/>
      <Box y={1340} z={110} w={2420} h={70} d={270} faces={{front:{background:'#e8dfcc'},top:{background:'#f4ecdc'}}}/>
    </Group>
    {/* One window, one soft patch of daylight across an open fitting area. */}
    <Plane x={1800} y={FLOOR-3} z={-4200} w={3400} h={2600} rx={90} rz={-20} style={{background:'radial-gradient(ellipse,rgba(255,241,193,.28),transparent 72%)'}}/>
    <Plane x={700} y={FLOOR-6} z={-4350} w={4200} h={3300} rx={90} style={{backgroundColor:'#b7ac98',backgroundImage:'repeating-linear-gradient(0deg,#fff2 0 2px,transparent 2px 12px),repeating-linear-gradient(90deg,#64594222 0 2px,transparent 2px 16px)',backgroundSize:'auto',border:'16px solid #b3a591',borderRadius:80,boxShadow:'inset 0 0 100px #7f6b501c'}}/>
    <Group x={-3900} z={-3200}>
      <Box y={FLOOR-340} w={1700} h={160} d={650} faces={{front:{background:'#b6a48d'},top:{background:"url('/assets/realism/linen.webp') center/cover"},right:{background:'#9d8c75'}}}/>
      {[-650,650].map(x=><Box key={x} x={x} y={FLOOR-140} w={65} h={280} d={450} faces={faces}/>)}
    </Group>
    <Mirror />
    <Plane x={-5600} y={FLOOR-600} z={-5600} w={900} h={1200} style={{background:"url('/assets/realism/plant.webp') center / contain no-repeat"}}/>
  </>
}
function WardrobeBay({x,index}:{x:number;index:number}) {
  const stock=index===0?'left':index===2?'right':null
  return <Group x={x}>
    <Plane y={130} z={673} w={1290} h={2660} style={wood(.32)}/>
    {[-650,650].map(a=><Box key={a} x={a} y={160} z={700} w={45} h={2810} d={660} faces={faces}/>)}
    <Box y={-1190} z={700} w={1350} h={55} d={660} faces={faces}/>
    <Plane y={-650} z={930} w={1240} h={15} style={{background:'linear-gradient(#eee2cf,#867662)',borderRadius:8}}/>
    {stock ? <Plane y={-250} z={950} w={1240} h={830} style={{backgroundImage:"url('/assets/flow1/wardrobe-stock-clean.png')",backgroundSize:'2490px 830px',backgroundPosition:stock==='left'?'left top':'right top',backgroundRepeat:'no-repeat'}}/> : <Plane y={-250} z={950} w={1240} h={830} style={{background:"url('/assets/realism/clothes.webp') center / contain no-repeat"}}/>}
    <Box y={-900} z={700} w={1290} h={32} d={630} faces={faces}/>
    <Plane y={-1020} z={970} w={1160} h={210} style={{background:"url('/assets/realism/folded.webp') center / contain no-repeat"}}/>
    {[390,930].map(y=><Group key={y} y={y}>
      <Box z={700} w={1290} h={32} d={630} faces={faces}/>
      {y===390?<Plane y={-125} z={970} w={1160} h={240} style={{background:"url('/assets/realism/folded.webp') center / contain no-repeat"}}/>:<Plane y={-160} z={970} w={1160} h={370} style={{background:"url('/assets/realism/shoes.webp') center / contain no-repeat"}}/>}
    </Group>)}
    <Box y={1300} z={1000} w={1280} h={470} d={35} faces={faces} frontChildren={<div style={{position:'absolute',left:'40%',right:'40%',top:80,height:12,borderRadius:5,background:'#b4a17d'}}/>}/>
  </Group>
}
function Mirror(){
 const mirror=useAnchor<HTMLDivElement>('mirror')
 return <Group x={5200} z={-4100} ry={-28}>
   <Box y={150} w={1300} h={2800} d={70} faces={{front:{background:'#b9a68b'},right:{background:'#8c7b62'},top:{background:'#d5c6ad'}}}/>
   <Plane ref={mirror} y={150} z={44} w={1210} h={2710} style={{background:'linear-gradient(110deg,#a99f8d,#dbd3c4 40%,#b4b3a6 76%,#eee7d9)',boxShadow:'inset 0 0 50px #8c816644'}}><div style={{position:'absolute',left:'6%',right:'6%',bottom:0,height:'25%',background:'linear-gradient(#b3a68d55,#8d7a5d99)',clipPath:'polygon(0 15%,100% 0,100% 100%,0 100%)'}}/></Plane>
 </Group>
}
