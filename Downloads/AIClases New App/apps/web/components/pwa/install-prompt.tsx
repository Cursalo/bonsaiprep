'use client'

import { useState, useEffect } from 'react'
import { Button } from '@ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Download, X, Smartphone, Monitor, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useLocalStorage('pwa-install-dismissed', false)
  const [installCount, setInstallCount] = useLocalStorage('pwa-install-attempts', 0)

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    const isAndroidInstalled = document.referrer.includes('android-app://')
    
    setIsInstalled(isStandalone || isInWebAppiOS || isAndroidInstalled)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show prompt if not dismissed and not installed
      if (!dismissed && !isInstalled && installCount < 3) {
        setTimeout(() => setShowPrompt(true), 3000) // Show after 3 seconds
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [dismissed, installCount, isInstalled])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      setInstallCount(prev => prev + 1)
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setShowPrompt(false)
      } else {
        console.log('User dismissed the install prompt')
        setDismissed(true)
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Error during installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
  }

  // Don't show if installed, dismissed, or no prompt available
  if (isInstalled || dismissed || !deferredPrompt || !showPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
      >
        <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">¡Instala AIClases!</CardTitle>
                  <CardDescription className="text-sm">
                    Accede más rápido y sin conexión
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Benefits */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span>Acceso instantáneo desde tu pantalla de inicio</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4 text-primary" />
                <span>Funciona sin conexión a internet</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Monitor className="h-4 w-4 text-primary" />
                <span>Experiencia nativa como una app</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleInstall}
                className="flex-1"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Instalar
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDismiss}
                size="sm"
              >
                Ahora no
              </Button>
            </div>

            {/* Install instructions for unsupported browsers */}
            <div className="text-xs text-muted-foreground">
              <p>
                Para iOS Safari: Toca <strong>Compartir</strong> → <strong>Añadir a pantalla de inicio</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for checking PWA install status
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      const isAndroidInstalled = document.referrer.includes('android-app://')
      
      return isStandalone || isInWebAppiOS || isAndroidInstalled
    }

    setIsInstalled(checkInstalled())

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Installation failed:', error)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    install,
    canInstall: !!deferredPrompt
  }
}