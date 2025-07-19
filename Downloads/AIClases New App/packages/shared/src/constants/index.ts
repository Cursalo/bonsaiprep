export const COURSE_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
} as const

export const SUBSCRIPTION_TYPES = {
  FREE: 'free',
  COURSE: 'course',
  PLUS: 'plus'
} as const

export const CREDIT_TRANSACTION_TYPES = {
  LESSON_COMPLETE: 'lesson_complete',
  QUIZ_PERFECT: 'quiz_perfect',
  QUIZ_GOOD: 'quiz_good',
  QUIZ_PASSED: 'quiz_passed',
  STREAK_BONUS: 'streak_bonus',
  REFERRAL_SIGNUP: 'referral_signup',
  REFERRAL_COMPLETE: 'referral_complete',
  SOCIAL_SHARE: 'social_share',
  COURSE_REVIEW: 'course_review',
  MENTOR_QUESTION: 'mentor_question',
  COURSE_PURCHASE: 'course_purchase',
  PREMIUM_LESSON: 'premium_lesson',
  CODE_REVIEW: 'code_review',
  CUSTOM_ROADMAP: 'custom_roadmap'
} as const

export const DAILY_CAPS = {
  FREE_USER: 100,
  COURSE_OWNER: 200,
  PLUS_SUBSCRIBER: 300
} as const

export const COURSE_CATEGORIES = [
  'fundamentos-ia',
  'machine-learning',
  'deep-learning',
  'nlp',
  'computer-vision',
  'productividad',
  'programacion',
  'herramientas-ia',
  'etica-ia',
  'ia-empresarial'
] as const

export const BADGE_RARITIES = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
} as const

export const MCP_TOOLS = {
  BRAVE_SEARCH: 'brave-search',
  CONTEXT7: 'context7',
  FETCH_HTTP: 'fetch-http',
  SUPABASE_QUERY: 'supabase-query'
} as const

export const GLASSMORPHISM_STYLES = {
  LIGHT: 'rgba(255, 255, 255, 0.35)',
  DARK: 'rgba(15, 23, 42, 0.4)',
  BORDER_LIGHT: 'rgba(255, 255, 255, 0.2)',
  BORDER_DARK: 'rgba(203, 213, 225, 0.1)'
} as const