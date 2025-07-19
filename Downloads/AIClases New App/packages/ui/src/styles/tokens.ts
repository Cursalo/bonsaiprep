export const tokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    glass: {
      light: 'rgba(255, 255, 255, 0.35)',
      dark: 'rgba(15, 23, 42, 0.4)',
      border: {
        light: 'rgba(255, 255, 255, 0.2)',
        dark: 'rgba(203, 213, 225, 0.1)'
      }
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    }
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },
  
  borderRadius: {
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px'
  },
  
  shadows: {
    glass: {
      light: '0 8px 32px rgba(0, 0, 0, 0.1)',
      dark: '0 8px 32px rgba(0, 0, 0, 0.3)'
    },
    glow: '0 0 20px rgba(59, 130, 246, 0.15)',
    elevated: '0 12px 40px rgba(0, 0, 0, 0.15)'
  },
  
  animations: {
    easing: {
      primary: 'cubic-bezier(0.4, 0.2, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    },
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '400ms'
    }
  }
} as const

export type Tokens = typeof tokens