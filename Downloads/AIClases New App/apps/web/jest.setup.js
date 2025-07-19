import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'
import { TextEncoder, TextDecoder } from 'util'
import { server } from './test-utils/mocks/server'

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn()
  disconnect = jest.fn()
  unobserve = jest.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn()
  disconnect = jest.fn()
  unobserve = jest.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: sessionStorageMock,
})

// Mock fetch
global.fetch = jest.fn()

// Mock navigator
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
})

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'test-secret',
  NEXTAUTH_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
  STRIPE_SECRET_KEY: 'sk_test_test',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_test',
}

// Mock console methods in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'error',
  })
  
  // Suppress console errors/warnings unless explicitly testing them
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
        args[0].includes('ReactDOM.render is no longer supported'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterEach(() => {
  // Clean up after each test
  server.resetHandlers()
  jest.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})

afterAll(() => {
  // Clean up after all tests
  server.close()
  console.error = originalError
  console.warn = originalWarn
})

// Increase test timeout for integration tests
jest.setTimeout(10000)

// Global test utilities
global.testUtils = {
  // Wait for element to appear/disappear
  waitFor: require('@testing-library/react').waitFor,
  
  // Wait for loading to complete
  waitForLoadingToFinish: () =>
    require('@testing-library/react').waitFor(
      () =>
        expect(
          require('@testing-library/react').screen.queryByLabelText(/loading/i)
        ).not.toBeInTheDocument(),
      { timeout: 3000 }
    ),
  
  // Wait for element with retry
  waitForElement: async (getElement, timeout = 3000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      try {
        const element = getElement()
        if (element) return element
      } catch (error) {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(`Element not found within ${timeout}ms`)
  },
}

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      replace: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isReady: true,
      isPreview: false,
      isLocaleDomain: false,
    }
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  notFound: jest.fn(),
  redirect: jest.fn(),
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn(),
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key) => key),
  useLocale: jest.fn(() => 'es'),
  useFormatter: jest.fn(() => ({
    dateTime: jest.fn(),
    number: jest.fn(),
    relativeTime: jest.fn(),
  })),
  NextIntlClientProvider: ({ children }) => children,
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    section: 'section',
    article: 'article',
    aside: 'aside',
    header: 'header',
    footer: 'footer',
    main: 'main',
    nav: 'nav',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    p: 'p',
    ul: 'ul',
    ol: 'ol',
    li: 'li',
    a: 'a',
    img: 'img',
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: jest.fn(() => ({ get: jest.fn(), set: jest.fn() })),
  useTransform: jest.fn(() => ({ get: jest.fn() })),
  useSpring: jest.fn(() => ({ get: jest.fn() })),
}))

// Setup custom matchers
expect.extend({
  toBeAccessible: async function (received) {
    const { axe } = require('jest-axe')
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
})

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit the process in tests
})

// Performance monitoring in tests
if (process.env.NODE_ENV === 'test') {
  const { PerformanceObserver, performance } = require('perf_hooks')
  
  global.performance = performance
  global.PerformanceObserver = PerformanceObserver
}