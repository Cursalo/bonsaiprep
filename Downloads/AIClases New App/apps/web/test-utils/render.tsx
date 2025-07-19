import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider } from 'next-intl'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'

// Mock messages for testing
const mockMessages = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
  },
  auth: {
    signIn: 'Sign In',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
  },
  courses: {
    title: 'Courses',
    enroll: 'Enroll',
    enrolled: 'Enrolled',
    price: 'Price',
  },
  navigation: {
    home: 'Home',
    courses: 'Courses',
    dashboard: 'Dashboard',
    profile: 'Profile',
  },
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add custom options
  locale?: string
  session?: any
  queryClient?: QueryClient
  theme?: string
}

function customRender(
  ui: ReactElement,
  {
    locale = 'es',
    session = null,
    queryClient,
    theme = 'light',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Create a new QueryClient for each test if not provided
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider attribute="class" defaultTheme={theme}>
        <NextIntlClientProvider
          locale={locale}
          messages={mockMessages}
          timeZone="America/Mexico_City"
        >
          <SessionProvider session={session}>
            <QueryClientProvider client={testQueryClient}>
              {children}
            </QueryClientProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </ThemeProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: testQueryClient,
  }
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Additional test utilities
export const createMockSession = (overrides = {}) => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    ...overrides.user,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
})

export const createMockCourse = (overrides = {}) => ({
  id: 'test-course-id',
  title: 'Test Course',
  description: 'A test course description',
  price: 99.99,
  duration: 3600,
  level: 'beginner',
  category: 'programming',
  instructor: 'Test Instructor',
  lessons: [],
  enrolled: false,
  ...overrides,
})

export const createMockLesson = (overrides = {}) => ({
  id: 'test-lesson-id',
  title: 'Test Lesson',
  content: 'Test lesson content',
  duration: 300,
  order: 1,
  completed: false,
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  credits: 100,
  enrolledCourses: [],
  completedLessons: [],
  ...overrides,
})

// Common test selectors
export const testSelectors = {
  // Navigation
  navHome: () => screen.getByRole('link', { name: /home/i }),
  navCourses: () => screen.getByRole('link', { name: /courses/i }),
  navDashboard: () => screen.getByRole('link', { name: /dashboard/i }),
  
  // Auth
  signInButton: () => screen.getByRole('button', { name: /sign in/i }),
  signOutButton: () => screen.getByRole('button', { name: /sign out/i }),
  emailInput: () => screen.getByLabelText(/email/i),
  passwordInput: () => screen.getByLabelText(/password/i),
  
  // Common UI
  loadingSpinner: () => screen.getByRole('status', { name: /loading/i }),
  errorMessage: () => screen.getByRole('alert'),
  successMessage: () => screen.getByText(/success/i),
  
  // Courses
  courseCard: (title?: string) => 
    title 
      ? screen.getByRole('article', { name: new RegExp(title, 'i') })
      : screen.getByRole('article'),
  enrollButton: () => screen.getByRole('button', { name: /enroll/i }),
  
  // Forms
  submitButton: () => screen.getByRole('button', { name: /submit/i }),
  cancelButton: () => screen.getByRole('button', { name: /cancel/i }),
  saveButton: () => screen.getByRole('button', { name: /save/i }),
}

// Custom matchers
export const customMatchers = {
  toBeAccessible: async (received: Element) => {
    const { axe } = await import('jest-axe')
    const results = await axe(received)
    
    if (results.violations.length === 0) {
      return {
        message: () => `Expected element to have accessibility violations`,
        pass: true,
      }
    }
    
    const violationMessages = results.violations
      .map(violation => `${violation.id}: ${violation.description}`)
      .join('\n')
    
    return {
      message: () => `Expected element to be accessible but found violations:\n${violationMessages}`,
      pass: false,
    }
  },
}

// Wait utilities
export const waitForLoadingToFinish = () =>
  waitFor(
    () =>
      expect(
        screen.queryByLabelText(/loading/i)
      ).not.toBeInTheDocument(),
    { timeout: 3000 }
  )

export const waitForErrorToAppear = () =>
  waitFor(
    () => expect(screen.getByRole('alert')).toBeInTheDocument(),
    { timeout: 1000 }
  )

// User event setup
export { default as userEvent } from '@testing-library/user-event'