'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  credits: number
  level: number
  theme: 'light' | 'dark' | 'auto'
  language: string
  mentor_personality: 'friendly' | 'professional' | 'casual'
}

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const user = session?.user as User | undefined

  const login = useCallback(async (provider?: string, options?: any) => {
    try {
      const result = await signIn(provider, {
        redirect: false,
        ...options,
      })
      
      if (result?.ok && !result?.error) {
        router.push(options?.callbackUrl || '/dashboard')
      }
      
      return result
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }, [router])

  const logout = useCallback(async (callbackUrl?: string) => {
    try {
      await signOut({
        redirect: false,
        callbackUrl: callbackUrl || '/',
      })
      router.push(callbackUrl || '/')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }, [router])

  const refreshSession = useCallback(async () => {
    try {
      await update()
    } catch (error) {
      console.error('Session refresh error:', error)
      throw error
    }
  }, [update])

  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'
  const isUnauthenticated = status === 'unauthenticated'

  // Check if user has enough credits
  const hasCredits = (amount: number): boolean => {
    return (user?.credits || 0) >= amount
  }

  // Check if user is enrolled in a course
  const isEnrolledInCourse = useCallback(async (courseId: string): Promise<boolean> => {
    if (!user) return false
    
    try {
      const response = await fetch(`/api/enrollments/check/${courseId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) return false
      
      const { enrolled } = await response.json()
      return enrolled
    } catch (error) {
      console.error('Error checking enrollment:', error)
      return false
    }
  }, [user])

  // Get user's progress for a course
  const getCourseProgress = useCallback(async (courseId: string) => {
    if (!user) return null
    
    try {
      const response = await fetch(`/api/progress/${courseId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) return null
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching course progress:', error)
      return null
    }
  }, [user])

  // Check if user has completed a lesson
  const hasCompletedLesson = useCallback(async (lessonId: string): Promise<boolean> => {
    if (!user) return false
    
    try {
      const response = await fetch(`/api/lessons/${lessonId}/completion`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) return false
      
      const { completed } = await response.json()
      return completed
    } catch (error) {
      console.error('Error checking lesson completion:', error)
      return false
    }
  }, [user])

  // Update user preferences
  const updatePreferences = useCallback(async (preferences: Partial<User>) => {
    if (!user) return false
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })
      
      if (!response.ok) return false
      
      await refreshSession()
      return true
    } catch (error) {
      console.error('Error updating preferences:', error)
      return false
    }
  }, [user, refreshSession])

  return {
    user,
    session,
    status,
    isAuthenticated,
    isLoading,
    isUnauthenticated,
    login,
    logout,
    refreshSession,
    hasCredits,
    isEnrolledInCourse,
    getCourseProgress,
    hasCompletedLesson,
    updatePreferences,
  }
}