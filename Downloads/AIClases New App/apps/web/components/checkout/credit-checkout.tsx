'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@ui/hooks/use-toast'
import { Button } from '@ui/components/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Separator } from '@ui/components/separator'
import { Check, CreditCard, Lock, Star, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@ui/utils'
import { CreditPackage, CREDIT_PACKAGES } from '@/lib/payments/stripe-client'

interface CreditCheckoutProps {
  selectedPackageId?: string
  onPackageSelect?: (packageId: string) => void
  className?: string
}

export function CreditCheckout({ selectedPackageId, onPackageSelect, className }: CreditCheckoutProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string>(selectedPackageId || 'popular')

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId)
    onPackageSelect?.(packageId)
  }

  const handleCheckout = async (packageId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          successUrl: `${window.location.origin}/dashboard/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/dashboard/credits?canceled=true`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo procesar el pago. Inténtalo de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold gradient-text">
          Compra AICredits
        </h2>
        <p className="text-muted-foreground">
          Elige el paquete perfecto para tu viaje de aprendizaje en IA
        </p>
      </div>

      {/* Package Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {CREDIT_PACKAGES.map((pkg, index) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={cn(
                'relative h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
                'bg-gradient-to-br from-card/50 to-background/50 backdrop-blur-sm border-border/50',
                selectedPackage === pkg.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                pkg.popular && 'border-primary/50 shadow-primary/20'
              )}
              onClick={() => handlePackageSelect(pkg.id)}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Más Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <CardDescription className="text-sm">
                  {pkg.description}
                </CardDescription>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">
                    ${pkg.price}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${pkg.pricePerCredit.toFixed(3)} por crédito
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Credits Display */}
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                    <Zap className="h-6 w-6 text-primary" />
                    {(pkg.credits + pkg.bonus).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pkg.credits.toLocaleString()} base
                    {pkg.bonus > 0 && ` + ${pkg.bonus.toLocaleString()} bonus`}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {pkg.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={selectedPackage === pkg.id ? 'default' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCheckout(pkg.id)
                  }}
                  disabled={loading}
                >
                  {loading && selectedPackage === pkg.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Comprar Ahora
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Security Notice */}
      <Card className="bg-muted/50 border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h3 className="font-semibold">Pago Seguro</h3>
              <p className="text-sm text-muted-foreground">
                Todos los pagos son procesados de forma segura mediante Stripe. 
                Tus datos de pago están protegidos con encriptación de nivel bancario.
              </p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-primary">256-bit SSL</div>
              <div className="text-muted-foreground">Encriptación</div>
            </div>
            <div>
              <div className="font-semibold text-primary">PCI DSS</div>
              <div className="text-muted-foreground">Compliant</div>
            </div>
            <div>
              <div className="font-semibold text-primary">Refund</div>
              <div className="text-muted-foreground">30 días</div>
            </div>
            <div>
              <div className="font-semibold text-primary">24/7</div>
              <div className="text-muted-foreground">Soporte</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="bg-muted/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Preguntas Frecuentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">¿Los créditos expiran?</h4>
            <p className="text-sm text-muted-foreground">
              No, tus AICredits nunca expiran y permanecen en tu cuenta hasta que los uses.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">¿Puedo cancelar mi compra?</h4>
            <p className="text-sm text-muted-foreground">
              Ofrecemos reembolsos completos dentro de los primeros 30 días de la compra.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">¿Qué métodos de pago aceptan?</h4>
            <p className="text-sm text-muted-foreground">
              Aceptamos todas las tarjetas de crédito principales, PayPal y transferencias bancarias.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}