import test from 'node:test'
import assert from 'node:assert/strict'
import { initialFlow1, transitionFlow1 as move, outfitById } from '../src/journeys/flow1/model.ts'
function toOptions(occasion = 'everyday') {
 let s = move(initialFlow1, { type: 'START_SCAN' })
 s = move(s, { type: 'SCAN_COMPLETED', revision: s.revision })
 s = move(s, { type: 'DETECTION_COMPLETED', revision: s.revision })
 s = move(s, { type: 'OCCASION_CHANGED', occasion })
 s = move(s, { type: 'ANALYSIS_REQUESTED' })
 return move(s, { type: 'ANALYSIS_COMPLETED', revision: s.revision })
}
test('Both original outfit branches preserve identity through turn, zoom, change, and confirm', () => {
 for (const outfitId of ['blue-linen', 'denim-jacket']) {
  let s = move(toOptions(), { type: 'OUTFIT_SELECTED', outfitId })
  assert.equal(s.state, 'wardrobe-tryon')
  s = move(s, { type: 'TURN', delta: -1 }); assert.equal(s.view, 3)
  s = move(s, { type: 'ZOOM', delta: 500 }); assert.equal(s.zoom, 1.8)
  s = move(s, { type: 'CONFIRM_OUTFIT' }); assert.equal(s.saved, outfitId)
  assert.equal(s.state, 'confirmed'); assert.equal(s.zoom, 1)
  s = move(s, { type: 'QUIET' }); s = move(s, { type: 'RESUME' })
  assert.equal(s.state, 'confirmed'); assert.equal(s.selected, outfitId)
  assert.equal(outfitById(s.selected).shoes, outfitId === 'blue-linen' ? 'White Sneakers' : 'Brown Boots')
 }
})
test('No analysis or preview can happen without the intentional confirmation path', () => {
 let s = move(initialFlow1, { type: 'ANALYSIS_REQUESTED' }); assert.equal(s.state, 'discover')
 s = move(s, { type: 'OUTFIT_SELECTED', outfitId: 'denim-jacket' }); assert.equal(s.state, 'discover')
 s = move(s, { type: 'CONFIRM_OUTFIT' }); assert.equal(s.saved, null)
})
test('Old scan and analysis completions cannot advance a restarted or quiet flow', () => {
 const first = move(initialFlow1, { type: 'START_SCAN' })
 let s = move(first, { type: 'RESTART' }); s = move(s, { type: 'START_SCAN' })
 assert.equal(move(s, { type: 'SCAN_COMPLETED', revision: first.revision }).state, 'wardrobe-scan')
 const quiet = move(toOptions(), { type: 'QUIET' })
 assert.deepEqual(move(quiet, { type: 'ANALYSIS_COMPLETED', revision: 0 }), quiet)
})
test('Changing outfits resets manipulation, while comparing preserves chosen identity and occasion', () => {
 let s = move(toOptions('outdoors'), { type: 'OUTFIT_SELECTED', outfitId: 'blue-linen' })
 s = move(s, { type: 'ZOOM', delta: .7 }); s = move(s, { type: 'TURN', delta: 2 })
 s = move(s, { type: 'PREVIEW_CHANGED', outfitId: 'denim-jacket' })
 assert.equal(s.view, 0); assert.equal(s.zoom, 1)
 s = move(s, { type: 'BACK' }); assert.equal(s.state, 'wardrobe-recommendations'); assert.equal(s.selected, 'denim-jacket'); assert.equal(s.occasion, 'outdoors')
})
test('Repeated commit does not re-enter a later stage or overwrite the selected result', () => {
 const s = move(toOptions(), { type: 'OUTFIT_SELECTED', outfitId: 'blue-linen' })
 assert.deepEqual(move(s, { type: 'OUTFIT_SELECTED', outfitId: 'denim-jacket' }), s)
 const confirmed = move(s, { type: 'CONFIRM_OUTFIT' })
 assert.deepEqual(move(confirmed, { type: 'PREVIEW_CHANGED', outfitId: 'denim-jacket' }), confirmed)
})

test('All sixteen real clothing combinations retain selected pieces across every angle and confirmation', async () => {
 const { currentLook, lookKey, lookNames } = await import('../src/journeys/flow1/model.ts')
 const keys = new Set()
 for (const top of ['blue-linen','denim-jacket','cotton-tee','olive-overshirt']) for (const bottom of ['jeans','black']) for (const shoes of ['sneakers','boots']) {
  let s = move(toOptions(), {type:'OUTFIT_SELECTED',outfitId:top})
  s = move(s,{type:'CUSTOMIZE_BOTTOM',bottom});s = move(s,{type:'CUSTOMIZE_SHOES',shoes})
  const key=lookKey(currentLook(s));keys.add(key)
  for(let angle=0;angle<4;angle++){assert.equal(lookKey(currentLook(s)),key);s=move(s,{type:'TURN',delta:1})}
  s=move(s,{type:'CONFIRM_OUTFIT'});assert.equal(lookKey(s.savedLook),key)
  assert.equal(lookNames(s.savedLook).shoes,shoes==='boots'?'Brown Boots':'White Sneakers')
  s=move(s,{type:'ADJUST_LOOK'});assert.equal(lookKey(currentLook(s)),key)
 }
 assert.equal(keys.size,16)
})
test('Changing a top retains the chosen trousers and shoes, reset restores that top’s starting outfit', async () => {
 const {currentLook}=await import('../src/journeys/flow1/model.ts')
 let s=move(toOptions(),{type:'OUTFIT_SELECTED',outfitId:'blue-linen'})
 s=move(s,{type:'CUSTOMIZE_TOP',outfitId:'denim-jacket'})
 assert.deepEqual(currentLook(s),{top:'denim-jacket',bottom:'jeans',shoes:'sneakers'})
 s=move(s,{type:'RESTORE_LOOK'})
 assert.deepEqual(currentLook(s),{top:'denim-jacket',bottom:'black',shoes:'boots'})
})
test('Browsing another look does not overwrite the saved custom outfit on quiet resume', async()=>{
 const {currentLook}=await import('../src/journeys/flow1/model.ts')
 let s=move(toOptions(),{type:'OUTFIT_SELECTED',outfitId:'blue-linen'})
 s=move(s,{type:'CUSTOMIZE_SHOES',shoes:'boots'});s=move(s,{type:'CONFIRM_OUTFIT'})
 s=move(s,{type:'BACK'});s=move(s,{type:'OUTFIT_SELECTED',outfitId:'denim-jacket'})
 s=move(s,{type:'QUIET'});s=move(s,{type:'RESUME'})
 assert.equal(s.state,'confirmed');assert.deepEqual(currentLook(s),{top:'blue-linen',bottom:'jeans',shoes:'boots'})
})

test('One occasion selection both records intent and starts analysis exactly once',()=>{
 let s=move(initialFlow1,{type:'START_SCAN'});s=move(s,{type:'SCAN_COMPLETED',revision:s.revision});s=move(s,{type:'DETECTION_COMPLETED',revision:s.revision});
 for(const occasion of ['everyday','outdoors']){
  const next=move(s,{type:'OCCASION_SELECTED',occasion});assert.equal(next.state,'ai-analysis');assert.equal(next.occasion,occasion);assert.deepEqual(move(next,{type:'OCCASION_SELECTED',occasion}),next)
 }
 assert.equal(move(initialFlow1,{type:'OCCASION_SELECTED',occasion:'outdoors'}).state,'discover')
})

test('Expanded wardrobe has a complete, distinct four-view asset for every generated combination', async()=>{
 const {readFileSync,statSync}=await import('node:fs');const data=JSON.parse(readFileSync(new URL('../src/journeys/flow1/extra-views.json',import.meta.url)));
 for(const [name,sheet] of Object.entries(data)){
  assert.equal(sheet.frames.length,8);assert.ok(statSync(new URL(`../public/assets/flow1/${name}.png`,import.meta.url)).size>10000);
  for(let row=0;row<2;row++)for(let col=0;col<4;col++){
   const [x,y,w,h]=sheet.frames[row*4+col];assert.ok(w>60&&h>500);assert.ok(x>=0&&y>=0&&x+w<=sheet.width&&y+h<=sheet.height);
   assert.ok(row===0?y<sheet.height/2:y>sheet.height/2);if(col)assert.ok(x>sheet.frames[row*4+col-1][0]);
  }
 }
})
test('Occasion changes recommendation emphasis without dropping any starting look',async()=>{
 const {rankedOutfits}=await import('../src/journeys/flow1/model.ts');assert.equal(rankedOutfits('outdoors')[0],'olive-overshirt');assert.equal(rankedOutfits('everyday')[0],'blue-linen');assert.deepEqual([...rankedOutfits('outdoors')].sort(),[...rankedOutfits('everyday')].sort())
})
