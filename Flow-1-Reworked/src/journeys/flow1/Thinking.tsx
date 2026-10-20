import { useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLens } from '../../state/store'
import { PIECES } from './catalogue'

const visuals = [
 {src:'/assets/realism/clothes.webp',width:1536,height:1024,box:'0 40 490 760'},
 {src:'/assets/realism/clothes.webp',width:1536,height:1024,box:'1000 45 310 730'},
 {src:'/assets/realism/clothes.webp',width:1536,height:1024,box:'590 130 290 620'},
 {src:'/assets/flow1/olive-boots.png',width:1254,height:1254,box:'122 113 208 290'},
 {src:'/assets/realism/folded.webp',width:1007,height:206,box:'25 30 295 170'},
 {src:'/assets/realism/folded.webp',width:1007,height:206,box:'345 35 300 165'},
 {src:'/assets/realism/shoes.webp',width:2172,height:724,box:'20 155 700 460'},
 {src:'/assets/realism/shoes.webp',width:2172,height:724,box:'720 30 700 570'},
]
function PieceVisual({index}:{index:number}){
 const v=visuals[index],id=useId(),[x,y,w,h]=v.box.split(' ').map(Number)
 return <svg className="f1-piece-visual" viewBox={v.box} role="img" aria-label={PIECES[index].name}><defs><clipPath id={id}><rect x={x} y={y} width={w} height={h}/></clipPath></defs><image href={v.src} width={v.width} height={v.height} clipPath={`url(#${id})`}/></svg>
}
const reasoning = [
 {title:'Start with what feels like you.',description:'Blue shirts and dark jeans are a pairing you come back to. That gives us a familiar place to start.',pieces:[0,4],note:'Your usual pairing'},
 {title:'Give the recent repeat some space.',description:'You wore denim with boots 5 days ago. A clean cotton tee gives those same trousers a lighter direction.',pieces:[1,2,5],note:'A fresh alternative to your last look'},
 {title:'Bring an overlooked layer back.',description:'It’s been 18 days since you wore olive. Keep familiar jeans and boots, and change the layer.',pieces:[3,4,7],note:'Something familiar, with a different feeling'},
]
export function WardrobeDiscovery({found,complete}:{found:number;complete:boolean}){
 const reduce=useLens(s=>s.reduceMotion),count=complete?8:found,index=Math.max(0,Math.min(7,count-1))
 return <div className="f1-discovery-story" data-found={count}>
  <div className="f1-thinking-kicker">{complete?'Your wardrobe, connected':`${count} of 8 pieces recognised`}</div>
  <AnimatePresence initial={false} mode="popLayout"><motion.div key={complete?'complete':index} className="f1-discovery-find" initial={{opacity:0,transform:reduce?'none':'translateY(12px)'}} animate={{opacity:1,transform:'translateY(0px)'}} exit={{opacity:0,transform:reduce?'none':'translateY(-8px)'}} transition={{duration:.2,ease:'easeOut'}}>
   <div className="f1-discovery-photo"><PieceVisual index={index}/><span>{PIECES[index].category}</span></div>
   <div className="f1-discovery-copy"><h1>{complete?'Eight pieces. Several new directions.':count===0?'Let’s see what’s here.':`I found your ${PIECES[index].name.toLowerCase()}.`}</h1><p>{complete?'Four tops and layers, two trousers, and two pairs of shoes. Next, let’s see what works together.':index<4?'First, the shirts and layers that set the feeling of a look.':index<6?'Now the trousers: a dark denim base and a clean black option.':'And the finishing pieces: keep it light, or add a warmer leather accent.'}</p></div>
  </motion.div></AnimatePresence>
  <div className="f1-discovered-pieces" aria-label="Recognised pieces">{PIECES.slice(0,count).map(piece=><motion.span key={piece.name} initial={{opacity:0,transform:reduce?'none':'translateY(6px)'}} animate={{opacity:1,transform:'translateY(0px)'}} transition={{duration:.2,ease:'easeOut'}}><i style={{background:piece.color}}/>{piece.name}</motion.span>)}</div>
 </div>
}
export function OutfitReasoning({phase,occasion}:{phase:number;occasion:'everyday'|'outdoors'}){
 const reduce=useLens(s=>s.reduceMotion),thought=reasoning[phase]
 return <div className="f1-reasoning-story" data-thinking-phase={phase}>
  <div className="f1-thinking-kicker">{occasion==='outdoors'?'For stepping out':'For your everyday'} · finding the balance</div>
  <AnimatePresence initial={false} mode="popLayout"><motion.div key={phase} initial={{opacity:0,transform:reduce?'none':'translateY(12px)'}} animate={{opacity:1,transform:'translateY(0px)'}} exit={{opacity:0,transform:reduce?'none':'translateY(-8px)'}} transition={{duration:.2,ease:'easeOut'}}>
   <h1>{thought.title}</h1><p className="f1-reasoning-description" role="status">{thought.description}</p>
   <div className="f1-pairing-board" aria-label={thought.note}>{thought.pieces.map((index,i)=><motion.div key={index} className="f1-pairing-piece" initial={{opacity:0,transform:reduce?'none':`translateY(${12+i*4}px)`}} animate={{opacity:1,transform:'translateY(0px)'}} transition={{duration:.25,delay:reduce?0:i*.08,ease:'easeOut'}}><PieceVisual index={index}/><span>{PIECES[index].name}</span></motion.div>)}</div>
   <div className="f1-pairing-note">{thought.note}</div>
  </motion.div></AnimatePresence>
  <div className="f1-thinking-factors" aria-label="Considering"><span className={phase===0?'is-current':''}>Usual pairings</span><span className={phase===1?'is-current':''}>Recent outfits</span><span className={phase===2?'is-current':''}>Less-worn pieces</span></div>
 </div>
}
