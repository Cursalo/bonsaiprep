export interface User {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  title: string
  description: string
  slug: string
  thumbnail?: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  durationHours: number
  priceCredits: number
  published: boolean
  createdAt: string
  updatedAt: string
  autoUpdateVersion: number
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  courseId: string
  title: string
  description: string
  content: string
  orderIndex: number
  durationMinutes: number
  dynamicContentBlocks?: DynamicContentBlock[]
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface DynamicContentBlock {
  id: string
  type: 'context7' | 'brave-search' | 'fetch-http'
  query: string
  libraryId?: string
  refreshInterval: string
  lastUpdated: string
  content: string
}

export interface UserCredits {
  userId: string
  totalEarned: number
  totalSpent: number
  currentBalance: number
  level: number
  createdAt: string
  updatedAt: string
}

export interface CreditTransaction {
  id: string
  userId: string
  amount: number
  transactionType: string
  referenceId?: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface UserProgress {
  id: string
  userId: string
  courseId: string
  completedLessons: number
  totalLessons: number
  lastLessonId?: string
  completionPercentage: number
  lastAccessed: string
  createdAt: string
  updatedAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  criteria: Record<string, any>
  creditsAwarded: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface UserBadge {
  id: string
  userId: string
  badgeId: string
  earnedAt: string
  creditsAwarded: number
}

export interface Subscription {
  id: string
  userId: string
  subscriptionType: 'free' | 'course' | 'plus'
  active: boolean
  createdAt: string
  expiresAt?: string
}