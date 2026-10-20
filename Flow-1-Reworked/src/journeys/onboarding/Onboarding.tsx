import { AnimatePresence, motion } from 'framer-motion'
import { useLens } from '../../state/store'
import { Welcome, Environment, Bead, Attention, FindPhone, PairCard } from './Arrival'
import { HeadStill, CalIntro, FivePoints, Sweep, EyesReady } from './Calibration'
import { HandIntro, HandDetect, HandTrack, HandsReady } from './Hands'
import { SwatchLesson } from './Lessons'
import { Learned, Activation } from './Finale'
import { FabricDefs } from './Swatch'
import './onboarding.css'

const STAGE_VIEWS: Record<number, () => React.ReactNode> = {
  2: () => <Environment />,
  3: () => <Attention />,
  4: () => <FindPhone />,
  7: () => <CalIntro />,
  8: () => <FivePoints />,
  9: () => <Sweep />,
  10: () => <EyesReady />,
  11: () => <HandIntro />,
  12: () => <HandDetect />,
  13: () => <HandTrack />,
  14: () => <HandsReady />,
  20: () => <Learned />,
  21: () => <Activation />,
}

/**
 * The 21 stages in order. Some surfaces persist across neighbouring stages
 * (the bead, the pairing card, the swatches, the held head) so the journey
 * reads as one continuous interaction rather than a slideshow.
 */
export function Onboarding({ ready }: { ready: boolean }) {
  const stage = useLens((s) => s.stage)
  const view = STAGE_VIEWS[stage]
  return (
    <>
      <FabricDefs />
      {stage === 1 && <Welcome ready={ready} />}

      <div className="layer" style={{ zIndex: 30 }}>
        <AnimatePresence>{stage >= 3 && stage <= 4 && <Bead key="bead" />}</AnimatePresence>
        <AnimatePresence>{stage >= 5 && stage <= 6 && <PairCard key="pair" />}</AnimatePresence>
        <AnimatePresence>{stage >= 8 && stage <= 10 && <HeadStill key="still" />}</AnimatePresence>
        <AnimatePresence>{stage >= 15 && stage <= 19 && <SwatchLesson key="swatches" />}</AnimatePresence>
        {view && <StageView key={stage}>{view()}</StageView>}
      </div>
    </>
  )
}

function StageView({ children }: { children: React.ReactNode }) {
  return (
    <motion.div className="layer" initial={{ opacity: 1 }} exit={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      {children}
    </motion.div>
  )
}
