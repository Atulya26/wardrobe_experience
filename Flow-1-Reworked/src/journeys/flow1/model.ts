export const FLOW1_STATES = [
  'discover', 'wardrobe-scan', 'wardrobe-auto-detection', 'wardrobe-user-confirmation',
  'ai-analysis', 'wardrobe-recommendations', 'wardrobe-tryon', 'confirmed', 'quiet',
] as const
export type Flow1State = typeof FLOW1_STATES[number]
export type OutfitId = 'blue-linen' | 'denim-jacket' | 'cotton-tee' | 'olive-overshirt'
export type BottomId = 'jeans' | 'black'
export type ShoeId = 'sneakers' | 'boots'
export type Look = { top: OutfitId; bottom: BottomId; shoes: ShoeId }
export type Occasion = 'everyday' | 'outdoors'
export const OUTFITS = [
  { id: 'blue-linen', title: 'Easy in linen', top: 'Blue Linen Shirt', bottom: 'Dark Jeans', shoes: 'White Sneakers', comfort: 4, lastWornDays: 12,
    reason: 'Breathable linen for a warm day. The dark denim keeps it grounded.', material: 'Linen weave', texture: 'linen', note: 'Light, breathable, easy to wear', image: 'linen-front.png', row: 0 },
  { id: 'denim-jacket', title: 'A little more structure', top: 'Denim Jacket', bottom: 'Black Pants', shoes: 'Brown Boots', comfort: 5, lastWornDays: 5,
    reason: 'A familiar layer with comfortable trousers. Good for a cooler start.', material: 'Denim twill', texture: 'denim', note: 'Structured layer, familiar comfort', image: 'denim-front.png', row: 1 },
  { id: 'cotton-tee', title: 'Clean and simple', top: 'White Cotton Tee', bottom: 'Black Pants', shoes: 'White Sneakers', comfort: 5, lastWornDays: 8,
    reason: 'A softer alternative to the blue shirt. Black trousers keep it clean.', material: 'Cotton jersey', texture: 'cotton', note: 'Simple, light, comfortable', image: 'cotton-sneakers.png', row: 1 },
  { id: 'olive-overshirt', title: 'An easy extra layer', top: 'Olive Overshirt', bottom: 'Dark Jeans', shoes: 'Brown Boots', comfort: 4, lastWornDays: 18,
    reason: 'An unworn layer brings a different colour into a familiar combination.', material: 'Cotton twill', texture: 'cotton', note: 'A light layer for stepping out', image: 'olive-boots.png', row: 0 },
] as const
export const outfitById = (id: OutfitId) => OUTFITS.find(outfit => outfit.id === id)!
export type Flow1Context = {
  state: Flow1State
  selected: OutfitId
  occasion: Occasion
  saved: OutfitId | null
  customBottom: BottomId | null
  customShoes: ShoeId | null
  savedLook: Look | null
  view: number
  zoom: number
  revision: number
}
export type Flow1Event =
  | { type: 'START_SCAN' }
  | { type: 'SCAN_COMPLETED'; revision: number }
  | { type: 'DETECTION_COMPLETED'; revision: number }
  | { type: 'ANALYSIS_REQUESTED' }
  | { type: 'OCCASION_SELECTED'; occasion: Occasion }
  | { type: 'ANALYSIS_COMPLETED'; revision: number }
  | { type: 'OUTFIT_SELECTED'; outfitId: OutfitId }
  | { type: 'PREVIEW_CHANGED'; outfitId: OutfitId }
  | { type: 'CUSTOMIZE_TOP'; outfitId: OutfitId }
  | { type: 'CUSTOMIZE_BOTTOM'; bottom: BottomId }
  | { type: 'CUSTOMIZE_SHOES'; shoes: ShoeId }
  | { type: 'RESTORE_LOOK' }
  | { type: 'ADJUST_LOOK' }
  | { type: 'OCCASION_CHANGED'; occasion: Occasion }
  | { type: 'TURN'; delta: number }
  | { type: 'ZOOM'; delta: number }
  | { type: 'RESET_VIEW' }
  | { type: 'CONFIRM_OUTFIT' }
  | { type: 'BACK' }
  | { type: 'QUIET' }
  | { type: 'RESUME' }
  | { type: 'RESTART' }
export const initialFlow1: Flow1Context = { state: 'discover', selected: 'blue-linen', occasion: 'everyday', saved: null, customBottom: null, customShoes: null, savedLook: null, view: 0, zoom: 1, revision: 0 }
export function transitionFlow1(s: Flow1Context, e: Flow1Event): Flow1Context {
  const go = (state: Flow1State, changes: Partial<Flow1Context> = {}) => ({ ...s, ...changes, state, revision: s.revision + 1 })
  if ('revision' in e && e.revision !== s.revision) return s
  switch (e.type) {
    case 'START_SCAN': return s.state === 'discover' ? go('wardrobe-scan') : s
    case 'SCAN_COMPLETED': return s.state === 'wardrobe-scan' ? go('wardrobe-auto-detection') : s
    case 'DETECTION_COMPLETED': return s.state === 'wardrobe-auto-detection' ? go('wardrobe-user-confirmation') : s
    case 'ANALYSIS_REQUESTED': return s.state === 'wardrobe-user-confirmation' ? go('ai-analysis') : s
    case 'ANALYSIS_COMPLETED': return s.state === 'ai-analysis' ? go('wardrobe-recommendations') : s
    case 'OCCASION_SELECTED': return s.state === 'wardrobe-user-confirmation' ? go('ai-analysis', { occasion: e.occasion }) : s
    case 'OCCASION_CHANGED': return s.state === 'wardrobe-user-confirmation' ? { ...s, occasion: e.occasion } : s
    case 'OUTFIT_SELECTED': return s.state === 'wardrobe-recommendations' ? go('wardrobe-tryon', { selected: e.outfitId, customBottom: null, customShoes: null, zoom: 1, view: 0 }) : s
    case 'PREVIEW_CHANGED': return s.state === 'wardrobe-tryon' ? { ...s, selected: e.outfitId, customBottom: null, customShoes: null, view: 0, zoom: 1 } : s
    case 'CUSTOMIZE_TOP': {
      const look = currentLook(s)
      return s.state === 'wardrobe-tryon' ? { ...s, selected: e.outfitId, customBottom: look.bottom, customShoes: look.shoes } : s
    }
    case 'CUSTOMIZE_BOTTOM': return s.state === 'wardrobe-tryon' ? { ...s, customBottom: e.bottom } : s
    case 'CUSTOMIZE_SHOES': return s.state === 'wardrobe-tryon' ? { ...s, customShoes: e.shoes } : s
    case 'RESTORE_LOOK': return s.state === 'wardrobe-tryon' ? { ...s, customBottom: null, customShoes: null, view: 0, zoom: 1 } : s
    case 'ADJUST_LOOK': return s.state === 'confirmed' ? go('wardrobe-tryon') : s
    case 'TURN': return s.state === 'wardrobe-tryon' ? { ...s, view: ((s.view + e.delta) % 4 + 4) % 4 } : s
    case 'ZOOM': return s.state === 'wardrobe-tryon' ? { ...s, zoom: Math.max(1, Math.min(1.8, s.zoom + e.delta)) } : s
    case 'RESET_VIEW': return { ...s, view: 0, zoom: 1 }
    case 'CONFIRM_OUTFIT': return s.state === 'wardrobe-tryon' ? go('confirmed', { saved: s.selected, savedLook: currentLook(s), zoom: 1, view: 0 }) : s
    case 'BACK': return s.state === 'wardrobe-tryon' || s.state === 'confirmed' ? go('wardrobe-recommendations', { zoom: 1, view: 0 }) : s
    case 'QUIET': return go('quiet', { zoom: 1, view: 0 })
    case 'RESUME': return s.state === 'quiet' ? s.savedLook ? go('confirmed', { selected: s.savedLook.top, customBottom: s.savedLook.bottom, customShoes: s.savedLook.shoes }) : go('discover') : s
    case 'RESTART': return { ...initialFlow1, revision: s.revision + 1 }
    default: return s
  }
}

export function currentLook(s: Pick<Flow1Context, 'selected' | 'customBottom' | 'customShoes'>): Look {
  return { top: s.selected, bottom: s.customBottom ?? defaultLook(s.selected).bottom, shoes: s.customShoes ?? defaultLook(s.selected).shoes }
}
export const TOP_KEYS: Record<OutfitId,string> = {'blue-linen':'linen','denim-jacket':'denim','cotton-tee':'cotton','olive-overshirt':'olive'}
export function defaultLook(top:OutfitId):Look { return {top,bottom:top==='blue-linen'||top==='olive-overshirt'?'jeans':'black',shoes:top==='blue-linen'||top==='cotton-tee'?'sneakers':'boots'} }
export function lookKey(look: Look) { return `${TOP_KEYS[look.top]}-${look.bottom}-${look.shoes}` }
export function lookNames(look: Look) {
  return { top: outfitById(look.top).top, bottom: look.bottom === 'jeans' ? 'Dark Jeans' : 'Black Pants', shoes: look.shoes === 'sneakers' ? 'White Sneakers' : 'Brown Boots' }
}

/** Occasion changes emphasis, while all four starting looks remain available. */
export function rankedOutfits(occasion:Occasion):OutfitId[] { return occasion==='outdoors'
 ? ['olive-overshirt','denim-jacket','blue-linen','cotton-tee']
 : ['blue-linen','cotton-tee','olive-overshirt','denim-jacket'] }
