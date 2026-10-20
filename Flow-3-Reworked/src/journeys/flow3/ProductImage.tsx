import { previewModel,previewName,type PreviewId } from './catalogue'
/** Crop the actual garment on the matched wearer; never relabel or tint another item. */
export function ProductImage({id}:{id:PreviewId}){return <svg viewBox="150 310 600 650" className="product-crop" role="img" aria-label={previewName(id)}><image href={previewModel(id)} x="0" y="0" width="875" height="1798"/></svg>}
