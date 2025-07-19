export const easings = {
  primary: [0.4, 0.2, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  smooth: [0.25, 0.46, 0.45, 0.94],
  swift: [0.55, 0.06, 0.68, 0.19]
} as const

export const durations = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  slower: 0.6
} as const

export const fadeInUp = {
  initial: { 
    opacity: 0, 
    y: 24 
  },
  animate: { 
    opacity: 1, 
    y: 0 
  },
  transition: {
    duration: durations.normal,
    ease: easings.primary
  }
}

export const scaleIn = {
  initial: { 
    opacity: 0, 
    scale: 0.95 
  },
  animate: { 
    opacity: 1, 
    scale: 1 
  },
  transition: {
    duration: durations.normal,
    ease: easings.primary
  }
}

export const slideInLeft = {
  initial: { 
    opacity: 0, 
    x: -32 
  },
  animate: { 
    opacity: 1, 
    x: 0 
  },
  transition: {
    duration: durations.normal,
    ease: easings.primary
  }
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export const buttonHover = {
  whileHover: { 
    y: -2,
    transition: { duration: durations.fast, ease: easings.swift }
  },
  whileTap: { 
    y: 0,
    scale: 0.98,
    transition: { duration: durations.fast }
  }
}

export const cardHover = {
  whileHover: {
    y: -4,
    scale: 1.02,
    transition: { duration: durations.normal, ease: easings.primary }
  }
}

export const glowOnHover = {
  whileHover: {
    boxShadow: [
      "0 8px 32px rgba(0, 0, 0, 0.1)",
      "0 12px 40px rgba(59, 130, 246, 0.15), 0 0 30px rgba(59, 130, 246, 0.1)"
    ],
    transition: { duration: durations.normal }
  }
}