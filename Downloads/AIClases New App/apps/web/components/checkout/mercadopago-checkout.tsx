'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@ui/hooks/use-toast'
import { Button } from '@ui/components/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/components/select'
import { Separator } from '@ui/components/separator'
import { Check, CreditCard, Globe, MapPin, Star, Zap, Clock, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@ui/utils'

interface MercadoPagoPackage {
  id: string
  credits: number
  bonus: number
  price: number
  currency: string
  formattedPrice: string
  totalCredits: number
  pricePerCredit: number
  popular: boolean
  recommended: boolean
}

interface CountryInfo {
  code: string
  name: string
  currency: string
}

interface SpecialOffer {
  id: string
  title: string
  description: string
  validUntil: string | null
  countries: string[]
}

interface MercadoPagoCheckoutProps {
  className?: string
}

export function MercadoPagoCheckout({ className }: MercadoPagoCheckoutProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [packages, setPackages] = useState<MercadoPagoPackage[]>([])
  const [countries, setCountries] = useState<CountryInfo[]>([])
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([])
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; name: string }>>([])
  const [currentCountry, setCurrentCountry] = useState<CountryInfo | null>(null)

  // Load available countries and packages
  useEffect(() => {
    loadCountriesAndPackages()
  }, [])

  // Reload packages when country changes
  useEffect(() => {
    if (selectedCountry) {
      loadCountriesAndPackages(selectedCountry)
    }
  }, [selectedCountry])

  const loadCountriesAndPackages = async (country?: string) => {
    try {
      const url = country 
        ? `/api/payments/mercadopago/countries?country=${country}`
        : '/api/payments/mercadopago/countries'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to load countries and packages')
      }

      const data = await response.json()
      
      setPackages(data.packages)
      setCountries(data.availableCountries)
      setSpecialOffers(data.specialOffers)
      setPaymentMethods(data.paymentMethods)
      setCurrentCountry(data.countryInfo)
      
      if (!selectedCountry) {
        setSelectedCountry(data.country)
      }
      
      // Auto-select popular package
      const popularPackage = data.packages.find((pkg: MercadoPagoPackage) => pkg.popular)
      if (popularPackage && !selectedPackage) {
        setSelectedPackage(popularPackage.id)
      }
    } catch (error) {
      console.error('Error loading countries and packages:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los paquetes de créditos.',
        variant: 'destructive',
      })
    }
  }

  const handleCheckout = async (packageId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/mercadopago/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          country: selectedCountry,
          successUrl: `${window.location.origin}/dashboard/credits?success=true&payment_id={{payment_id}}&status={{status}}`,
          failureUrl: `${window.location.origin}/dashboard/credits?failure=true&payment_id={{payment_id}}&status={{status}}`,
          pendingUrl: `${window.location.origin}/dashboard/credits?pending=true&payment_id={{payment_id}}&status={{status}}`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create MercadoPago preference')
      }

      const { initPoint, sandboxInitPoint } = await response.json()
      
      // Redirect to MercadoPago checkout
      const checkoutUrl = process.env.NODE_ENV === 'production' ? initPoint : sandboxInitPoint
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('MercadoPago checkout error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo procesar el pago. Inténtalo de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getPackageFeatures = (pkg: MercadoPagoPackage) => {
    const features = [
      'Acceso a cursos básicos',
      'Mentor AI básico',
      'Certificados estándar',
    ]

    if (pkg.totalCredits >= 1200) {
      features.push('Acceso a todos los cursos', 'Mentor AI avanzado', 'Certificados premium')
    }

    if (pkg.totalCredits >= 2500) {
      features.push('Sesiones 1:1 con instructores', 'Acceso anticipado a nuevos cursos')
    }

    if (pkg.totalCredits >= 5000) {
      features.push('API access para desarrolladores', 'Certificaciones corporativas')
    }

    return features
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold gradient-text">
          Compra AICredits - LATAM
        </h2>
        <p className="text-muted-foreground">
          Paga en tu moneda local con MercadoPago
        </p>
      </div>

      {/* Country Selector */}
      <Card className="bg-gradient-to-br from-card/50 to-background/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Selecciona tu País</CardTitle>
          </div>
          <CardDescription>
            Los precios se mostrarán en tu moneda local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona tu país" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {country.name} ({country.currency})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {currentCountry && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">
                  {currentCountry.name}
                </Badge>
                <span className="text-muted-foreground">
                  Precios en {currentCountry.currency}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Special Offers */}
      {specialOffers.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Ofertas Especiales</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {specialOffers.map((offer) => (
              <div key={offer.id} className="flex items-start gap-3">
                <div className="p-1 bg-primary/20 rounded">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{offer.title}</h4>
                  <p className="text-sm text-muted-foreground">{offer.description}</p>
                  {offer.validUntil && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Válido hasta {new Date(offer.validUntil).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Package Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg, index) => (
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
              onClick={() => setSelectedPackage(pkg.id)}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              )}

              {pkg.recommended && (
                <div className="absolute -top-3 right-3">
                  <Badge variant="secondary" className="px-2 py-1">
                    Recomendado
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-lg">
                  {pkg.credits.toLocaleString()} Créditos
                </CardTitle>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">
                    {pkg.formattedPrice}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(pkg.pricePerCredit * 100).toFixed(2)} {pkg.currency} por 100 créditos
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Credits Display */}
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-xl font-bold">
                    <Zap className="h-5 w-5 text-primary" />
                    {pkg.totalCredits.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pkg.credits.toLocaleString()} base
                    {pkg.bonus > 0 && ` + ${pkg.bonus.toLocaleString()} bonus`}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-1">
                  {getPackageFeatures(pkg).slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
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
                      Comprar
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment Methods */}
      {paymentMethods.length > 0 && (
        <Card className="bg-muted/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Métodos de Pago Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{method.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="bg-muted/50 border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h3 className="font-semibold">Pago Seguro con MercadoPago</h3>
              <p className="text-sm text-muted-foreground">
                Todos los pagos son procesados de forma segura mediante MercadoPago. 
                Tus datos están protegidos con la misma seguridad que usan los bancos.
              </p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-primary">PCI DSS</div>
              <div className="text-muted-foreground">Certificado</div>
            </div>
            <div>
              <div className="font-semibold text-primary">SSL 256-bit</div>
              <div className="text-muted-foreground">Encriptación</div>
            </div>
            <div>
              <div className="font-semibold text-primary">Garantía</div>
              <div className="text-muted-foreground">Comprador</div>
            </div>
            <div>
              <div className="font-semibold text-primary">24/7</div>
              <div className="text-muted-foreground">Soporte</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}