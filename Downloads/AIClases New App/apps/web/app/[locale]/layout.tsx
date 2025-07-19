import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { authOptions } from '@/lib/auth'
import { AuthProvider } from '@/lib/auth-context'
import { CreditsProvider } from '@/lib/credits-context'
import { ErrorBoundary } from '@/components/error-boundary/error-boundary'
import { ToastProvider } from '@/components/toast/toast-provider'
import { Navigation } from '@/components/navigation/navigation'
import { Footer } from '@/components/footer/footer'
import { locales, type Locale } from '@/i18n'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metadata' })
  
  // Determine base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aiclases.com'
  
  return {
    title: {
      default: t('title'),
      template: `%s | ${t('siteName')}`
    },
    description: t('description'),
    keywords: t('keywords').split(',').map(k => k.trim()),
    authors: [{ name: t('author') }],
    creator: t('siteName'),
    publisher: t('siteName'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'es': '/es',
        'en': '/en', 
        'pt': '/pt',
        'x-default': '/es'
      }
    },
    openGraph: {
      type: 'website',
      locale: getOpenGraphLocale(locale as Locale),
      url: `/${locale}`,
      title: t('title'),
      description: t('description'),
      siteName: t('siteName'),
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: t('siteName'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/og-image.jpg'],
      creator: '@aiclases',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

function getOpenGraphLocale(locale: Locale): string {
  switch (locale) {
    case 'es':
      return 'es_ES'
    case 'en':
      return 'en_US'
    case 'pt':
      return 'pt_BR'
    default:
      return 'es_ES'
  }
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const session = await getServerSession(authOptions)
  
  // Get messages for this locale
  let messages
  try {
    messages = (await import(`../../messages/${locale}.json`)).default
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error)
    notFound()
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ErrorBoundary level="critical">
        <AuthProvider session={session}>
          <ToastProvider>
            <CreditsProvider>
              <ErrorBoundary level="page">
                <div className="relative flex min-h-screen flex-col">
                  <Navigation />
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                </div>
              </ErrorBoundary>
            </CreditsProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </NextIntlClientProvider>
  )
}