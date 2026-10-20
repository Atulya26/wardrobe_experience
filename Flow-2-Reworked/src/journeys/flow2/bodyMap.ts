import type { Outfit } from './model'

/** Pixel landmarks on the actual 875 × 1798 source plates, not screen percentages. */
export const BODY_IMAGE = { width: 875, height: 1798 }
export type FitZone = 'shoulders'|'chest'|'sleeves'|'waist'|'cuff'
type Landmark = { path: string; bounds: [number,number,number,number] }
export const BODY_MAP: Record<Outfit,Record<FitZone,Landmark>> = {
 linen: {
  shoulders:{path:'M324 338 Q301 361 287 405 M581 340 Q612 363 632 407',bounds:[268,320,385,110]},
  chest:{path:'M318 505 L309 512 L309 553 M606 505 L615 512 L615 553',bounds:[300,480,324,100]},
  sleeves:{path:'M229 901 Q255 889 285 885 M650 887 Q677 883 708 891',bounds:[216,862,82,65]},
  waist:{path:'M301 900 Q338 910 380 913 M536 910 Q580 905 621 886',bounds:[292,865,338,70]},
  cuff:{path:'M381 1606 Q420 1616 469 1609 M570 1629 Q610 1639 659 1630',bounds:[365,1588,310,67]},
 },
 denim: {
  shoulders:{path:'M283 345 Q259 370 244 418 M615 345 Q638 373 650 417',bounds:[228,328,438,112]},
  chest:{path:'M292 487 L282 496 L282 543 M616 487 L626 496 L626 543',bounds:[272,470,365,100]},
  sleeves:{path:'M211 906 Q243 893 280 889 M636 888 Q669 883 706 892',bounds:[198,867,94,64]},
  waist:{path:'M292 838 Q338 848 383 849 M531 838 Q578 833 617 818',bounds:[280,799,350,74]},
  cuff:{path:'M383 1608 Q426 1619 470 1611 M578 1624 Q625 1637 669 1626',bounds:[367,1588,318,69]},
 },
}

/** Small local highlight patches, kept clear of the face and empty space. */
export const BODY_PATCHES: Record<Outfit,Record<FitZone,[number,number,number,number][]>> = {
 linen:{shoulders:[[278,330,64,88],[574,332,65,88]],chest:[[325,495,275,92]],sleeves:[[218,862,80,70],[638,860,82,70]],waist:[[338,867,235,65]],cuff:[[369,1585,112,67],[558,1608,112,67]]},
 denim:{shoulders:[[232,338,68,88],[605,338,68,88]],chest:[[302,483,302,92]],sleeves:[[198,867,94,70],[626,863,94,70]],waist:[[330,807,230,65]],cuff:[[371,1588,112,67],[568,1608,112,67]]},
}
