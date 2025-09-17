'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// Create a wrapper component for motion
const MotionWrapper = dynamic(
  () => import('framer-motion').then((mod) => {
    const MotionComponent: ComponentType<any> = ({ children, ...props }) => {
      const MotionDiv = mod.motion.div
      return <MotionDiv {...props}>{children}</MotionDiv>
    }
    return { default: MotionComponent }
  }),
  { 
    ssr: false,
    loading: () => <div />
  }
)

// Create a wrapper component for AnimatePresence
const AnimatePresenceWrapper = dynamic(
  () => import('framer-motion').then((mod) => {
    return { default: mod.AnimatePresence }
  }),
  { 
    ssr: false,
    loading: () => null
  }
)

// Export the wrappers
export const AnimatePresence = AnimatePresenceWrapper

// Create motion object with proper component wrappers
export const motion = {
  div: MotionWrapper,
  span: MotionWrapper,
  p: MotionWrapper,
  h1: MotionWrapper,
  h2: MotionWrapper,
  h3: MotionWrapper,
  section: MotionWrapper,
  article: MotionWrapper,
  button: MotionWrapper,
  img: MotionWrapper,
}
