'use client'

import { useState } from 'react'
import { 
  Zap, 
  CreditCard, 
  Gift, 
  TrendingUp, 
  CheckCircle,
  Star,
  Award,
  ShoppingCart,
  Globe
} from 'lucide-react'
import { Button } from '@ui/components/button'
import { Card } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/components/tabs'
import { CreditCheckout } from '@/components/checkout/credit-checkout'
import { MercadoPagoCheckout } from '@/components/checkout/mercadopago-checkout'

const creditPackages = [
  {
    id: 'starter',
    name: 'Paquete Starter',
    credits: 500,
    price: 29,
    pricePerCredit: 0.058,
    popular: false,
    bonus: 0,
    description: 'Perfecto para comenzar tu viaje en IA'
  },
  {
    id: 'popular',
    name: 'Paquete Popular',
    credits: 1200,
    price: 59,
    pricePerCredit: 0.049,
    popular: true,
    bonus: 200,
    description: 'El más elegido por nuestros estudiantes'
  },
  {
    id: 'pro',
    name: 'Paquete Pro',
    credits: 2500,
    price: 99,
    pricePerCredit: 0.040,
    popular: false,
    bonus: 500,
    description: 'Para estudiantes serios que quieren dominar la IA'
  },
  {
    id: 'enterprise',
    name: 'Paquete Enterprise',
    credits: 5000,
    price: 179,
    pricePerCredit: 0.036,
    popular: false,
    bonus: 1000,
    description: 'La mejor relación precio-valor'
  }
]

const earnCreditsWays = [
  {
    icon: Award,
    title: 'Completar Cursos',
    description: 'Gana 50-100 créditos por cada curso completado',
    action: 'Ver Cursos'
  },
  {
    icon: Star,
    title: 'Calificar Cursos',
    description: 'Recibe 25 créditos por cada reseña que escribas',
    action: 'Mis Cursos'
  },
  {
    icon: Gift,
    title: 'Referir Amigos',
    description: 'Gana 200 créditos por cada amigo que se registre',
    action: 'Referir'
  },
  {
    icon: TrendingUp,
    title: 'Actividad Diaria',
    description: 'Estudia 7 días seguidos y gana 100 créditos extra',
    action: 'Dashboard'
  }
]

const transactions = [
  {
    id: '1',
    type: 'purchase',
    amount: 1200,
    description: 'Compra Paquete Popular',
    date: '2024-01-15',
    price: 59
  },
  {
    id: '2',
    type: 'spent',
    amount: -600,
    description: 'Inscripción - Fundamentos de IA',
    date: '2024-01-14',
    price: null
  },
  {
    id: '3',
    type: 'earned',
    amount: 100,
    description: 'Curso completado - Productividad con IA',
    date: '2024-01-10',
    price: null
  },
  {
    id: '4',
    type: 'earned',
    amount: 25,
    description: 'Reseña escrita',
    date: '2024-01-08',
    price: null
  }
]

function CreditPackageCard({ pkg }: { pkg: typeof creditPackages[0] }) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handlePurchase = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement payment logic
      console.log('Purchasing package:', pkg.id)
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error('Purchase error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={`p-6 glass-morphism border-0 relative ${
      pkg.popular ? 'ring-2 ring-primary' : ''
    }`}>
      {pkg.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white">
          Más Popular
        </Badge>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">{pkg.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
        
        <div className="mb-4">
          <div className="text-3xl font-bold text-primary mb-1">
            {pkg.credits + pkg.bonus} créditos
          </div>
          {pkg.bonus > 0 && (
            <div className="text-sm text-green-600">
              {pkg.credits} + {pkg.bonus} bonus
            </div>
          )}
        </div>
        
        <div className="text-2xl font-bold mb-1">
          ${pkg.price}
        </div>
        <div className="text-sm text-muted-foreground">
          ${pkg.pricePerCredit.toFixed(3)} por crédito
        </div>
      </div>
      
      <Button 
        className="w-full glass-morphism"
        onClick={handlePurchase}
        disabled={isLoading}
      >
        {isLoading ? (
          'Procesando...'
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Comprar Ahora
          </>
        )}
      </Button>
    </Card>
  )
}

function TransactionItem({ transaction }: { transaction: typeof transactions[0] }) {
  const getIcon = () => {
    switch (transaction.type) {
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-blue-500" />
      case 'spent':
        return <ShoppingCart className="h-4 w-4 text-red-500" />
      case 'earned':
        return <Gift className="h-4 w-4 text-green-500" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getAmountColor = () => {
    switch (transaction.type) {
      case 'purchase':
      case 'earned':
        return 'text-green-600'
      case 'spent':
        return 'text-red-600'
      default:
        return ''
    }
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border glass-morphism">
      <div className="flex items-center gap-3">
        {getIcon()}
        <div>
          <h4 className="font-medium">{transaction.description}</h4>
          <p className="text-sm text-muted-foreground">
            {new Date(transaction.date).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <div className={`font-medium ${getAmountColor()}`}>
          {transaction.amount > 0 ? '+' : ''}{transaction.amount} créditos
        </div>
        {transaction.price && (
          <div className="text-sm text-muted-foreground">
            ${transaction.price}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CreditsPage() {
  const [userCredits] = useState(750)
  const [totalSpent] = useState(2650)
  const [totalEarned] = useState(3400)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Gestión de Créditos
        </h1>
        <p className="text-muted-foreground">
          Compra créditos, ve tu historial y descubre cómo ganar más
        </p>
      </div>

      {/* Credits Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 glass-morphism border-0 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div className="text-3xl font-bold text-primary mb-2">
            {userCredits}
          </div>
          <div className="text-sm text-muted-foreground">
            Créditos Disponibles
          </div>
        </Card>

        <Card className="p-6 glass-morphism border-0 text-center">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-500 mb-2">
            {totalEarned}
          </div>
          <div className="text-sm text-muted-foreground">
            Total Ganados
          </div>
        </Card>

        <Card className="p-6 glass-morphism border-0 text-center">
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-6 w-6 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-500 mb-2">
            {totalSpent}
          </div>
          <div className="text-sm text-muted-foreground">
            Total Gastados
          </div>
        </Card>
      </div>

      {/* Credit Packages */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Comprar Créditos</h2>
        
        <Tabs defaultValue="international" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="international" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Internacional
            </TabsTrigger>
            <TabsTrigger value="latam" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              LATAM
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="international">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Pago Internacional con Stripe</h3>
              <p className="text-muted-foreground">
                Paga con tarjeta de crédito, débito o PayPal en USD
              </p>
            </div>
            <CreditCheckout />
          </TabsContent>
          
          <TabsContent value="latam">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Pago Local con MercadoPago</h3>
              <p className="text-muted-foreground">
                Paga en tu moneda local con cuotas y efectivo
              </p>
            </div>
            <MercadoPagoCheckout />
          </TabsContent>
        </Tabs>
      </section>

      {/* Earn Credits */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Ganar Créditos Gratis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {earnCreditsWays.map((way, index) => (
            <Card key={index} className="p-6 glass-morphism border-0">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <way.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{way.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{way.description}</p>
              <Button variant="outline" size="sm" className="glass-morphism">
                {way.action}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Transaction History */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Historial de Transacciones</h2>
        <Card className="p-6 glass-morphism border-0">
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="outline" className="glass-morphism">
              Ver Historial Completo
            </Button>
          </div>
        </Card>
      </section>

      {/* Help Section */}
      <Card className="p-6 glass-morphism border-0">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Información Importante
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">¿Cómo funcionan los créditos?</h4>
            <ul className="space-y-1">
              <li>• 1 crédito = $0.05 USD aproximadamente</li>
              <li>• Los créditos no expiran nunca</li>
              <li>• Puedes usarlos para cualquier curso</li>
              <li>• Se aplican automáticamente en el checkout</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Formas de pago</h4>
            <ul className="space-y-1">
              <li>• Tarjetas de crédito y débito</li>
              <li>• PayPal y transferencias</li>
              <li>• Criptomonedas (Bitcoin, Ethereum)</li>
              <li>• Pago en efectivo (tiendas OXXO)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}