import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Can be imported from a shared config
export const locales = ['es', 'en', 'pt'] as const
export type Locale = typeof locales[number]

export const defaultLocale: Locale = 'es'

// Locale configurations with detailed metadata
export const localeConfig = {
  es: {
    name: 'Español',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
    currency: 'USD', // We use credits, but USD for reference
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
    regions: ['ES', 'MX', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY'],
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
    regions: ['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'ZA'],
  },
  pt: {
    name: 'Português',
    nativeName: 'Português',
    flag: '🇧🇷',
    direction: 'ltr',
    currency: 'USD',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
    regions: ['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL'],
  },
} as const

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  try {
    const messages = (await import(`./messages/${locale}.json`)).default
    
    return {
      messages,
      timeZone: getTimeZoneForLocale(locale as Locale),
      now: new Date(),
      formats: {
        dateTime: {
          short: {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          },
          medium: {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          },
          long: {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long'
          }
        },
        number: {
          precise: {
            maximumFractionDigits: 5
          },
          currency: {
            style: 'currency',
            currency: localeConfig[locale as Locale].currency
          },
          percent: {
            style: 'percent',
            maximumFractionDigits: 1
          }
        }
      }
    }
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error)
    notFound()
  }
})

// Helper function to get timezone based on locale
function getTimeZoneForLocale(locale: Locale): string {
  switch (locale) {
    case 'es':
      return 'Europe/Madrid' // Default to Spain, but this could be dynamic
    case 'en':
      return 'America/New_York' // Default to EST
    case 'pt':
      return 'America/Sao_Paulo' // Default to Brazil
    default:
      return 'UTC'
  }
}

// Helper function to detect locale from various sources
export function detectLocale(
  request: Request,
  userPreference?: string,
  browserLanguages?: readonly string[]
): Locale {
  // 1. User preference (from database/cookies)
  if (userPreference && locales.includes(userPreference as Locale)) {
    return userPreference as Locale
  }

  // 2. URL path
  const url = new URL(request.url)
  const pathLocale = url.pathname.split('/')[1]
  if (pathLocale && locales.includes(pathLocale as Locale)) {
    return pathLocale as Locale
  }

  // 3. Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language')
  if (acceptLanguage) {
    const preferredLanguages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase())
    
    for (const lang of preferredLanguages) {
      // Exact match
      if (locales.includes(lang as Locale)) {
        return lang as Locale
      }
      
      // Language code match (e.g., 'en-US' -> 'en')
      const langCode = lang.split('-')[0]
      if (locales.includes(langCode as Locale)) {
        return langCode as Locale
      }
    }
  }

  // 4. Browser languages (if provided)
  if (browserLanguages) {
    for (const lang of browserLanguages) {
      const langCode = lang.split('-')[0].toLowerCase()
      if (locales.includes(langCode as Locale)) {
        return langCode as Locale
      }
    }
  }

  // 5. Geographic detection based on common regions
  const userAgent = request.headers.get('User-Agent') || ''
  const cfCountry = request.headers.get('CF-IPCountry') // Cloudflare country header
  
  if (cfCountry) {
    const country = cfCountry.toLowerCase()
    
    // Portuguese-speaking countries
    if (['br', 'pt', 'ao', 'mz', 'cv', 'gw', 'st', 'tl'].includes(country)) {
      return 'pt'
    }
    
    // English-speaking countries
    if (['us', 'gb', 'ca', 'au', 'nz', 'ie', 'za'].includes(country)) {
      return 'en'
    }
    
    // Spanish-speaking countries (default for LATAM)
    if (['es', 'mx', 'ar', 'cl', 'co', 'pe', 've', 'ec', 'bo', 'py', 'uy', 'gt', 'hn', 'sv', 'ni', 'cr', 'pa', 'do', 'cu'].includes(country)) {
      return 'es'
    }
  }

  // Default fallback
  return defaultLocale
}

// Utility function for RTL support (future-proofing)
export function isRTL(locale: Locale): boolean {
  return localeConfig[locale].direction === 'rtl'
}

// Utility function to get currency symbol
export function getCurrencySymbol(locale: Locale): string {
  const currency = localeConfig[locale].currency
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  
  return formatter.formatToParts(0)
    .find(part => part.type === 'currency')?.value || '$'
}

// Utility function to format numbers according to locale
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

// Utility function to format dates according to locale
export function formatDate(
  date: Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, options).format(date)
}

// Utility function to get available locales with metadata
export function getAvailableLocales() {
  return locales.map(locale => ({
    code: locale,
    ...localeConfig[locale],
  }))
}