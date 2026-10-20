import { create } from 'zustand'

export type VoicePhase = 'idle' | 'listening' | 'heard' | 'empty'
export type HandTone = 'light' | 'medium' | 'tan' | 'brown' | 'deep'
export const HAND_TONES: { id: HandTone; label: string; swatch: string }[] = [
  { id: 'light', label: 'Light', swatch: '#e9c3a6' },
  { id: 'medium', label: 'Medium', swatch: '#d29c76' },
  { id: 'tan', label: 'Tan', swatch: '#b67d55' },
  { id: 'brown', label: 'Brown', swatch: '#8a5636' },
  { id: 'deep', label: 'Deep', swatch: '#5c3721' },
]
const savedTone = (() => {
  try {
    const t = localStorage.getItem('lens.handTone')
    return HAND_TONES.some((x) => x.id === t) ? (t as HandTone) : 'medium'
  } catch {
    return 'medium' as HandTone
  }
})()

type LensState = {
  /** onboarding stage, 1–21 */
  stage: number
  attended: string | null
  settled: boolean
  handFocus: string | null
  handRaised: boolean
  voice: VoicePhase
  voiceTranscript: string
  sound: boolean
  reduceMotion: boolean
  /** 1 = default dwell; larger = slower, more forgiving */
  dwellScale: number
  showHelp: boolean
  /** set when the user is driving with the keyboard */
  keyboardMode: boolean
  /** how the wearer's own hand is drawn — a laptop has no camera to see it */
  handTone: HandTone
  setHandTone: (t: HandTone) => void
  setStage: (n: number) => void
  next: () => void
  prev: () => void
}

const prefersReduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const useLens = create<LensState>((set, get) => ({
  stage: 1,
  attended: null,
  settled: false,
  handFocus: null,
  handRaised: false,
  voice: 'idle',
  voiceTranscript: '',
  sound: true,
  reduceMotion: !!prefersReduced,
  dwellScale: 1,
  showHelp: false,
  keyboardMode: false,
  handTone: savedTone,
  setHandTone: (t) => {
    try {
      localStorage.setItem('lens.handTone', t)
    } catch {
      /* private mode: keep it for this session only */
    }
    set({ handTone: t })
  },
  setStage: (n) => set({ stage: Math.max(1, Math.min(21, n)) }),
  next: () => get().setStage(get().stage + 1),
  prev: () => get().setStage(get().stage - 1),
}))

export const STAGES: { n: number; name: string }[] = [
  { n: 1, name: 'Welcome' },
  { n: 2, name: 'Environment awareness' },
  { n: 3, name: 'Attention' },
  { n: 4, name: 'Find the phone' },
  { n: 5, name: 'Pairing' },
  { n: 6, name: 'Paired' },
  { n: 7, name: 'Gaze calibration' },
  { n: 8, name: 'Five points' },
  { n: 9, name: 'Range sweep' },
  { n: 10, name: 'Eyes ready' },
  { n: 11, name: 'Hands' },
  { n: 12, name: 'Hand detection' },
  { n: 13, name: 'Hand tracking' },
  { n: 14, name: 'Hands ready' },
  { n: 15, name: 'Look and hold' },
  { n: 16, name: 'Reach' },
  { n: 17, name: 'Pinch and voice' },
  { n: 18, name: 'Pinch to zoom' },
  { n: 19, name: 'Swipe' },
  { n: 20, name: 'Skills learned' },
  { n: 21, name: 'Companion active' },
]
