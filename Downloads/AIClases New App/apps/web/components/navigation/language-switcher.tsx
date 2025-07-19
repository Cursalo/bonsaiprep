'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Check, Globe } from 'lucide-react'
import { Button } from '@ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/components/dropdown-menu'
import { getAvailableLocales, type Locale } from '@/i18n'

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('navigation')
  
  const availableLocales = getAvailableLocales()
  const currentLocaleData = availableLocales.find(l => l.code === locale)

  const handleLocaleChange = (newLocale: Locale) => {
    // Remove current locale from pathname if it exists
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
    
    // Create new path with the selected locale
    const newPath = newLocale === 'es' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`
    
    // Navigate to the new path
    router.push(newPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 px-0 glass-morphism"
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 glass-morphism">
        {availableLocales.map((localeData) => (
          <DropdownMenuItem
            key={localeData.code}
            onClick={() => handleLocaleChange(localeData.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{localeData.flag}</span>
              <span>{localeData.nativeName}</span>
            </div>
            {locale === localeData.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function LanguageSwitcherExpanded() {
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('common')
  
  const availableLocales = getAvailableLocales()

  const handleLocaleChange = (newLocale: Locale) => {
    // Remove current locale from pathname if it exists
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
    
    // Create new path with the selected locale
    const newPath = newLocale === 'es' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`
    
    // Navigate to the new path
    router.push(newPath)
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        🌍 Idioma / Language
      </h3>
      <div className="grid gap-2">
        {availableLocales.map((localeData) => (
          <Button
            key={localeData.code}
            variant={locale === localeData.code ? "default" : "ghost"}
            onClick={() => handleLocaleChange(localeData.code)}
            className="justify-start h-auto p-3 text-left glass-morphism"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{localeData.flag}</span>
              <div>
                <div className="font-medium">{localeData.nativeName}</div>
                <div className="text-xs text-muted-foreground">{localeData.name}</div>
              </div>
            </div>
            {locale === localeData.code && (
              <Check className="h-4 w-4 ml-auto text-primary" />
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}