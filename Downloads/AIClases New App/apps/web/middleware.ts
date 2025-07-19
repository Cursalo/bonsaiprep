import { NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { withAuth } from 'next-auth/middleware'
import { locales, defaultLocale, detectLocale } from './i18n'

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // Only add prefix for non-default locales
  localeDetection: true,
  alternateLinks: true,
})

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/mentor',
  '/credits',
  '/admin',
  '/learn',
  '/profile',
  '/settings',
]

// Define admin routes that require admin privileges
const adminRoutes = [
  '/admin',
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/courses',
  '/about',
  '/contact',
  '/pricing',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/offline',
]

// API routes that should not be processed by intl middleware
const apiRoutes = [
  '/api',
  '/auth',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/sw.js',
  '/workbox-',
]

function isProtectedRoute(pathname: string): boolean {
  // Remove locale prefix to check the actual route
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
  
  return protectedRoutes.some(route => {
    if (route === '/') return routeWithoutLocale === '/'
    return routeWithoutLocale.startsWith(route)
  })
}

function isAdminRoute(pathname: string): boolean {
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
  
  return adminRoutes.some(route => {
    return routeWithoutLocale.startsWith(route)
  })
}

function isPublicRoute(pathname: string): boolean {
  const routeWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
  
  return publicRoutes.some(route => {
    if (route === '/') return routeWithoutLocale === '/'
    return routeWithoutLocale.startsWith(route)
  })
}

function isApiRoute(pathname: string): boolean {
  return apiRoutes.some(route => pathname.startsWith(route))
}

// Enhanced locale detection with user preferences
async function enhancedLocaleDetection(request: NextRequest): Promise<string> {
  // Get user preference from cookie
  const userLocale = request.cookies.get('NEXT_LOCALE')?.value
  
  // Get browser languages
  const acceptLanguage = request.headers.get('Accept-Language')
  const browserLanguages = acceptLanguage
    ? acceptLanguage.split(',').map(lang => lang.split(';')[0].trim())
    : []

  // Use our custom detection logic
  const detectedLocale = detectLocale(
    request,
    userLocale,
    browserLanguages
  )

  return detectedLocale
}

// Custom intl middleware with enhanced locale detection
async function customIntlMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (!pathnameHasLocale) {
    // Detect the appropriate locale
    const locale = await enhancedLocaleDetection(request)
    
    // Only redirect if it's not the default locale or if we need to add a prefix
    if (locale !== defaultLocale) {
      const newUrl = new URL(`/${locale}${pathname}`, request.url)
      
      // Preserve search params
      newUrl.search = request.nextUrl.search
      
      return NextResponse.redirect(newUrl)
    }
  }

  // Let the intl middleware handle the rest
  return intlMiddleware(request)
}

// Auth middleware
const authMiddleware = withAuth(
  function onSuccess(req) {
    // Continue with intl middleware after auth
    return customIntlMiddleware(req)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Always allow access to API routes
        if (isApiRoute(pathname)) {
          return true
        }

        // Allow access to public routes
        if (isPublicRoute(pathname)) {
          return true
        }

        // For protected routes, check if user is authenticated
        if (isProtectedRoute(pathname)) {
          if (!token) {
            return false
          }

          // For admin routes, check admin privileges
          if (isAdminRoute(pathname)) {
            // Check if user has admin role
            const userRole = token.role as string
            const isAdmin = token.isAdmin as boolean
            
            return isAdmin || ['super_admin', 'admin', 'moderator'].includes(userRole)
          }

          return true
        }

        // Default to requiring authentication for unknown routes
        return !!token
      },
    },
    pages: {
      signIn: '/login',
      error: '/auth/error',
    },
  }
)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes and static files
  if (isApiRoute(pathname)) {
    return NextResponse.next()
  }

  // Add security headers
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers })
  }

  // Special handling for service worker and manifest
  if (pathname === '/sw.js' || pathname === '/manifest.json') {
    return NextResponse.next()
  }

  // Check if route requires authentication
  if (isProtectedRoute(pathname) || isAdminRoute(pathname)) {
    return authMiddleware(request)
  }

  // For public routes, just run intl middleware
  return customIntlMiddleware(request)
}

export const config = {
  // Match all routes except API routes and static files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt
     * - sitemap.xml
     * - manifest.json
     * - sw.js
     * - workbox-* (service worker files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|sw.js|workbox-.*|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.woff$|.*\\.woff2$|.*\\.ttf$|.*\\.otf$).*)',
  ],
}

// Utility function to get locale from request
export function getLocaleFromRequest(request: NextRequest): string {
  const pathname = request.nextUrl.pathname
  const locale = pathname.split('/')[1]
  
  if (locales.includes(locale as any)) {
    return locale
  }
  
  return defaultLocale
}

// Utility function to redirect to localized path
export function redirectToLocalizedPath(
  request: NextRequest,
  path: string,
  locale?: string
): NextResponse {
  const targetLocale = locale || getLocaleFromRequest(request)
  const localizedPath = targetLocale === defaultLocale ? path : `/${targetLocale}${path}`
  
  return NextResponse.redirect(new URL(localizedPath, request.url))
}