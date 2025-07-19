import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Paquete Starter',
    credits: 500,
    bonus: 0,
    price: 29,
    pricePerCredit: 0.058,
    popular: false,
    description: 'Perfecto para comenzar tu viaje en IA',
    features: [
      'Acceso a cursos básicos',
      'Mentor AI básico',
      'Certificados estándar',
    ],
  },
  {
    id: 'popular',
    name: 'Paquete Popular',
    credits: 1200,
    bonus: 200,
    price: 59,
    pricePerCredit: 0.049,
    popular: true,
    description: 'El más elegido por nuestros estudiantes',
    features: [
      'Acceso a todos los cursos',
      'Mentor AI avanzado',
      'Certificados premium',
      '200 créditos bonus',
      'Soporte prioritario',
    ],
  },
  {
    id: 'pro',
    name: 'Paquete Pro',
    credits: 2500,
    bonus: 500,
    price: 99,
    pricePerCredit: 0.040,
    popular: false,
    description: 'Para estudiantes serios que quieren dominar la IA',
    features: [
      'Acceso ilimitado',
      'Mentor AI premium',
      'Certificados blockchain',
      '500 créditos bonus',
      'Sesiones 1:1 con instructores',
      'Acceso anticipado a nuevos cursos',
    ],
  },
  {
    id: 'enterprise',
    name: 'Paquete Enterprise',
    credits: 5000,
    bonus: 1000,
    price: 179,
    pricePerCredit: 0.036,
    popular: false,
    description: 'La mejor relación precio-valor',
    features: [
      'Todo lo del Plan Pro',
      '1000 créditos bonus',
      'Acceso a webinars exclusivos',
      'Mentoría grupal mensual',
      'API access para desarrolladores',
      'Certificaciones corporativas',
    ],
  },
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeFeatures = searchParams.get('features') === 'true'

    let packages = CREDIT_PACKAGES.map(pkg => ({
      ...pkg,
      totalCredits: pkg.credits + pkg.bonus,
      savings: pkg.popular ? Math.round((pkg.price * 0.2)) : 0,
    }))

    if (!includeFeatures) {
      packages = packages.map(({ features, ...pkg }) => pkg)
    }

    // Add dynamic pricing based on user level or special offers
    const userLevel = (session.user as any)?.level || 1
    
    if (userLevel >= 5) {
      // VIP users get 10% discount
      packages = packages.map(pkg => ({
        ...pkg,
        originalPrice: pkg.price,
        price: Math.round(pkg.price * 0.9),
        vipDiscount: true,
      }))
    }

    // Add limited time offers
    const now = new Date()
    const isWeekend = now.getDay() === 0 || now.getDay() === 6
    
    if (isWeekend) {
      packages = packages.map(pkg => {
        if (pkg.id === 'popular') {
          return {
            ...pkg,
            bonus: pkg.bonus + 100,
            totalCredits: pkg.credits + pkg.bonus + 100,
            weekendBonus: true,
          }
        }
        return pkg
      })
    }

    return NextResponse.json({
      packages,
      userLevel,
      specialOffers: {
        weekend: isWeekend,
        vipDiscount: userLevel >= 5,
      },
    })
  } catch (error) {
    console.error('Credit packages API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}