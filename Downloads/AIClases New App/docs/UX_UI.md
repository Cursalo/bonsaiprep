# AIClases 4.0 - Guía UX/UI: Glass Elegance Design System

## 🎨 Filosofía de Diseño: "Glass Elegance"

### Concepto Central
**Glass Elegance** combina la sobriedad profesional con la modernidad del glassmorphism, creando una experiencia visual que transmite confianza, claridad y vanguardia tecnológica. Es el equilibrio perfecto entre **funcionalidad educativa** y **estética 2025**.

### Principios de Diseño

#### 1. **Claridad Contextual**
- Jerarquía visual clara que guía al estudiante sin distracciones
- Espaciado generoso que respeta el contenido educativo
- Contraste optimizado para sesiones de estudio prolongadas

#### 2. **Elegancia Funcional**
- Componentes que comunican su función de manera intuitiva
- Transiciones que refuerzan la narrativa de aprendizaje
- Micro-interacciones que celebran el progreso

#### 3. **Adaptabilidad Contextual**
- Sistema responsive que se adapta desde 320px hasta 4K
- Temas dark/light que respetan preferencias del usuario
- Densidade de información ajustable según el dispositivo

## 🌈 Paleta de Colores

### Colores Primarios
```css
:root {
  /* Primary - Blue Intellect */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;  /* Main brand */
  --primary-600: #2563eb;  /* Interactive states */
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;
  --primary-950: #172554;
}
```

### Colores Secundarios
```css
:root {
  /* Secondary - Silver Tech */
  --secondary-50: #f8fafc;
  --secondary-100: #f1f5f9;
  --secondary-200: #e2e8f0;
  --secondary-300: #cbd5e1;
  --secondary-400: #94a3b8;
  --secondary-500: #64748b;
  --secondary-600: #475569;
  --secondary-700: #334155;
  --secondary-800: #1e293b;
  --secondary-900: #0f172a;
  --secondary-950: #020617;
}
```

### Colores Funcionales
```css
:root {
  /* Success - Green Growth */
  --success-500: #10b981;
  --success-600: #059669;
  --success-700: #047857;
  
  /* Warning - Amber Alert */
  --warning-500: #f59e0b;
  --warning-600: #d97706;
  --warning-700: #b45309;
  
  /* Error - Red Critical */
  --error-500: #ef4444;
  --error-600: #dc2626;
  --error-700: #b91c1c;
  
  /* Info - Cyan Knowledge */
  --info-500: #06b6d4;
  --info-600: #0891b2;
  --info-700: #0e7490;
}
```

### Sistema Dark/Light
```css
/* Light Theme */
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #64748b;
  --border-primary: #e2e8f0;
  --border-secondary: #cbd5e1;
  
  /* Glass Effects */
  --glass-bg: rgba(255, 255, 255, 0.35);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-shadow: rgba(0, 0, 0, 0.1);
}

/* Dark Theme */
[data-theme="dark"] {
  --bg-primary: #020617;
  --bg-secondary: #0f172a;
  --bg-tertiary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  --border-primary: #334155;
  --border-secondary: #475569;
  
  /* Glass Effects */
  --glass-bg: rgba(15, 23, 42, 0.4);
  --glass-border: rgba(203, 213, 225, 0.1);
  --glass-shadow: rgba(0, 0, 0, 0.3);
}
```

## 📝 Tipografía

### Jerarquía Tipográfica
```css
/* Inter Variable como fuente principal */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

/* JetBrains Mono para código */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

:root {
  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Scale tipográfica */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  --text-6xl: 3.75rem;    /* 60px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
}
```

### Clases Tipográficas
```css
.heading-hero {
  font-size: var(--text-6xl);
  font-weight: 800;
  line-height: var(--leading-tight);
  letter-spacing: -0.025em;
}

.heading-section {
  font-size: var(--text-4xl);
  font-weight: 700;
  line-height: var(--leading-tight);
  letter-spacing: -0.025em;
}

.heading-card {
  font-size: var(--text-2xl);
  font-weight: 600;
  line-height: var(--leading-snug);
}

.body-large {
  font-size: var(--text-lg);
  font-weight: 400;
  line-height: var(--leading-relaxed);
}

.body-default {
  font-size: var(--text-base);
  font-weight: 400;
  line-height: var(--leading-normal);
}

.code-inline {
  font-family: var(--font-mono);
  font-size: 0.9em;
  font-weight: 500;
  padding: 0.125rem 0.25rem;
  background: var(--glass-bg);
  border-radius: 0.25rem;
}
```

## ✨ Glassmorphism & Efectos

### CSS Base del Glassmorphism
```css
/* Clase base para elementos glass */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  box-shadow: 
    0 8px 32px var(--glass-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Variantes de intensidad */
.glass-subtle {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-medium {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
}

.glass-strong {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Efectos especiales */
.glass-glow {
  box-shadow: 
    0 0 20px rgba(59, 130, 246, 0.15),
    0 8px 32px var(--glass-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glass-pressed {
  transform: translateY(1px);
  box-shadow: 
    0 4px 16px var(--glass-shadow),
    inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### Componentes Glass Predefinidos
```css
/* Card Glass */
.card-glass {
  @apply glass rounded-xl p-6;
  transition: all 250ms cubic-bezier(0.4, 0.2, 0.2, 1);
}

.card-glass:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 40px var(--glass-shadow),
    0 0 30px rgba(59, 130, 246, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Button Glass */
.btn-glass {
  @apply glass px-6 py-3 rounded-lg font-medium;
  transition: all 250ms cubic-bezier(0.4, 0.2, 0.2, 1);
}

.btn-glass:hover {
  background: rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
}

.btn-glass:active {
  @apply glass-pressed;
}

/* Navigation Glass */
.nav-glass {
  @apply glass-subtle;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  transition: background 250ms ease;
}

.nav-glass.scrolled {
  @apply glass-medium;
}
```

## 🎭 Micro-Animaciones con Framer Motion

### Configuración Base
```typescript
// lib/animations.ts
export const easings = {
  // Curva principal de AIClases
  primary: [0.4, 0.2, 0.2, 1],
  
  // Variantes especializadas
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
```

### Animaciones de Entrada
```typescript
// components/animations/EntranceAnimations.tsx
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

// Stagger para listas
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}
```

### Animaciones Interactivas
```typescript
// components/animations/InteractiveAnimations.tsx
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
```

### Animaciones de Progreso
```typescript
// components/animations/ProgressAnimations.tsx
export const progressBar = {
  initial: { width: 0 },
  animate: { width: "var(--progress-width)" },
  transition: {
    duration: durations.slow,
    ease: easings.smooth
  }
}

export const creditCounter = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.1, 1] },
  transition: {
    duration: durations.normal,
    ease: easings.bounce
  }
}

export const levelUp = {
  initial: { 
    scale: 1,
    rotate: 0 
  },
  animate: { 
    scale: [1, 1.2, 1],
    rotate: [0, 5, -5, 0]
  },
  transition: {
    duration: durations.slower,
    ease: easings.bounce
  }
}
```

## 🏗️ Hero Bento Grid

### Estructura del Bento Grid
```typescript
// components/hero/BentoGrid.tsx
export function BentoGrid() {
  return (
    <section className="hero-bento-container">
      <div className="bento-grid">
        {/* Celda principal - Título y CTA */}
        <motion.div 
          className="bento-cell bento-main"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <HeroTitle />
          <HeroDescription />
          <CTAButtons />
        </motion.div>

        {/* Celda de estadísticas */}
        <motion.div 
          className="bento-cell bento-stats"
          variants={slideInRight}
          initial="initial"
          animate="animate"
        >
          <StatsDisplay />
        </motion.div>

        {/* Celda de preview de curso */}
        <motion.div 
          className="bento-cell bento-preview"
          variants={scaleIn}
          initial="initial"
          animate="animate"
        >
          <CoursePreview />
        </motion.div>

        {/* Celda de testimonios */}
        <motion.div 
          className="bento-cell bento-testimonials"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          <TestimonialCarousel />
        </motion.div>

        {/* Celda de shaders metálicos */}
        <motion.div 
          className="bento-cell bento-shader"
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <MetallicShaderBackground />
        </motion.div>
      </div>
    </section>
  )
}
```

### CSS del Bento Grid
```css
.hero-bento-container {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(
    135deg,
    var(--bg-primary) 0%,
    var(--bg-secondary) 100%
  );
}

.bento-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 1.5rem;
  height: calc(100vh - 4rem);
}

.bento-cell {
  @apply glass rounded-2xl p-6;
  position: relative;
  overflow: hidden;
}

.bento-main {
  grid-column: 1 / 8;
  grid-row: 1 / 4;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.bento-stats {
  grid-column: 8 / 13;
  grid-row: 1 / 3;
}

.bento-preview {
  grid-column: 1 / 6;
  grid-row: 4 / 7;
}

.bento-testimonials {
  grid-column: 6 / 10;
  grid-row: 4 / 7;
}

.bento-shader {
  grid-column: 10 / 13;
  grid-row: 3 / 7;
  background: linear-gradient(
    45deg,
    #1e293b,
    #334155,
    #475569
  );
}

/* Responsive Bento */
@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(8, 1fr);
  }
  
  .bento-main {
    grid-column: 1 / 7;
    grid-row: 1 / 4;
  }
  
  .bento-stats {
    grid-column: 1 / 4;
    grid-row: 4 / 6;
  }
  
  .bento-preview {
    grid-column: 4 / 7;
    grid-row: 4 / 6;
  }
  
  .bento-testimonials {
    grid-column: 1 / 7;
    grid-row: 6 / 8;
  }
  
  .bento-shader {
    grid-column: 1 / 7;
    grid-row: 8 / 9;
  }
}

@media (max-width: 640px) {
  .bento-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: auto;
  }
  
  .bento-cell {
    min-height: 200px;
  }
}
```

### Shaders Metálicos (CSS + Canvas)
```typescript
// components/hero/MetallicShader.tsx
export function MetallicShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Configurar dimensiones
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Crear gradiente metálico animado
    let animationId: number
    let time = 0

    function animate() {
      time += 0.01
      
      // Limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Crear gradiente metálico dinámico
      const gradient = ctx.createLinearGradient(
        0, 0, 
        canvas.width + Math.sin(time) * 100, 
        canvas.height + Math.cos(time) * 100
      )
      
      gradient.addColorStop(0, `hsl(${200 + Math.sin(time) * 20}, 30%, ${20 + Math.sin(time * 0.5) * 10}%)`)
      gradient.addColorStop(0.3, `hsl(${220 + Math.cos(time) * 15}, 40%, ${30 + Math.cos(time * 0.3) * 15}%)`)
      gradient.addColorStop(0.7, `hsl(${240 + Math.sin(time * 0.7) * 25}, 35%, ${25 + Math.sin(time * 0.8) * 12}%)`)
      gradient.addColorStop(1, `hsl(${200 + Math.cos(time * 0.4) * 30}, 45%, ${35 + Math.cos(time * 0.6) * 18}%)`)
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Agregar highlights metálicos
      ctx.globalCompositeOperation = 'overlay'
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time * 2) * 0.05})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.globalCompositeOperation = 'source-over'
      
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-80"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
```

## 🧱 Design Tokens

### Archivo de Tokens
```typescript
// packages/ui/src/styles/tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a'
    },
    glass: {
      light: 'rgba(255, 255, 255, 0.35)',
      dark: 'rgba(15, 23, 42, 0.4)',
      border: {
        light: 'rgba(255, 255, 255, 0.2)',
        dark: 'rgba(203, 213, 225, 0.1)'
      }
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
```

### Configuración Tailwind
```typescript
// tailwind.config.ts
import { tokens } from './packages/ui/src/styles/tokens'

const config: Config = {
  content: [
    "./packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "./apps/web/app/**/*.{js,ts,jsx,tsx}",
    "./apps/web/components/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        glass: tokens.colors.glass,
      },
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      animation: {
        'fade-in-up': 'fadeInUp 0.25s cubic-bezier(0.4, 0.2, 0.2, 1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.4, 0.2, 0.2, 1)',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.25)' }
        }
      },
      fontFamily: {
        sans: ['Inter Variable', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio')
  ]
}

export default config
```

## 🧩 Componentes Radix-UI/Shadcn

### Button Component
```typescript
// packages/ui/src/components/atoms/Button.tsx
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { buttonHover } from '../../animations'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700",
        glass: "glass text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950",
        outline: "border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950",
        ghost: "text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-8",
        xl: "h-12 px-10 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  animated?: boolean
}

export function Button({ 
  className, 
  variant, 
  size, 
  asChild = false,
  animated = true,
  ...props 
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  
  const buttonElement = (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
  
  if (animated) {
    return (
      <motion.div {...buttonHover}>
        {buttonElement}
      </motion.div>
    )
  }
  
  return buttonElement
}
```

### Card Component
```typescript
// packages/ui/src/components/molecules/Card.tsx
import { motion } from 'framer-motion'
import { cardHover, glowOnHover } from '../../animations'
import { cn } from '../../utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  glow?: boolean
  animated?: boolean
  children: React.ReactNode
}

export function Card({ 
  className, 
  glass = false,
  glow = false,
  animated = true,
  children,
  ...props 
}: CardProps) {
  const cardClasses = cn(
    "rounded-xl p-6 transition-all duration-250",
    glass ? "glass" : "bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700",
    glow && "hover:shadow-glow",
    className
  )
  
  if (animated) {
    return (
      <motion.div
        className={cardClasses}
        variants={cardHover}
        whileHover={glow ? glowOnHover.whileHover : cardHover.whileHover}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
  
  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  )
}
```

## 📱 Responsive Design

### Breakpoints System
```css
/* Breakpoints personalizados para AIClases */
:root {
  --screen-xs: 360px;    /* Móviles pequeños */
  --screen-sm: 640px;    /* Móviles */
  --screen-md: 768px;    /* Tablets */
  --screen-lg: 1024px;   /* Laptops */
  --screen-xl: 1280px;   /* Desktops */
  --screen-2xl: 1536px;  /* Large desktops */
  --screen-3xl: 1920px;  /* Ultra wide */
}
```

### Mobile-First Approach
```css
/* Containers responsivos */
.container-mobile {
  width: 100%;
  padding: 0 1rem;
  max-width: 100%;
}

@media (min-width: 640px) {
  .container-mobile {
    max-width: 640px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .container-mobile {
    max-width: 1024px;
    padding: 0 2rem;
  }
}

@media (min-width: 1280px) {
  .container-mobile {
    max-width: 1200px;
  }
}
```

### Typography Responsive
```css
/* Escalas tipográficas responsivas */
.heading-responsive {
  font-size: clamp(1.5rem, 4vw, 3rem);
  line-height: 1.2;
}

.body-responsive {
  font-size: clamp(0.875rem, 2.5vw, 1.125rem);
  line-height: 1.6;
}

.glass-responsive {
  backdrop-filter: blur(clamp(8px, 2vw, 16px));
}
```

Esta guía asegura una experiencia visual consistente, moderna y funcional que distingue a AIClases como una plataforma educativa de vanguardia.