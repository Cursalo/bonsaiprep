'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  CheckCircle, 
  CreditCard, 
  Zap, 
  Shield, 
  Clock,
  BookOpen,
  Award,
  Users
} from 'lucide-react'
import { Button } from '@ui/components/button'
import { Card } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Progress } from '@ui/components/progress'

interface EnrollPageProps {
  params: {
    slug: string
  }
}

// Mock course data
const courseData: Record<string, any> = {
  'fundamentos-ia': {
    id: '1',
    title: 'Fundamentos de Inteligencia Artificial',
    description: 'Aprende los conceptos básicos de IA desde cero. Un curso completo para principiantes.',
    slug: 'fundamentos-ia',
    price: 600,
    originalPrice: 800,
    level: 'Principiante',
    duration: 8,
    lessons: 12,
    students: 2340,
    rating: 4.9,
    instructor: 'Dr. María Elena Vázquez',
    includes: [
      'Acceso de por vida al curso',
      'Certificado verificable en blockchain',
      'Mentor AI personalizado 24/7',
      'Proyectos prácticos incluidos',
      'Acceso a la comunidad exclusiva',
      'Actualizaciones automáticas del contenido',
      'Soporte técnico prioritario',
      'Descargables y recursos adicionales'
    ],
    curriculum: [
      '¿Qué es la Inteligencia Artificial?',
      'Historia de la IA',
      'Tipos de Aprendizaje Automático',
      'Redes Neuronales Básicas',
      'IA en la Vida Cotidiana',
      'Ética en la Inteligencia Artificial'
    ],
    testimonials: [
      {
        name: 'Ana García',
        comment: 'Excelente curso para comenzar en IA. Muy bien explicado.',
        rating: 5
      },
      {
        name: 'Carlos López',
        comment: 'El Mentor AI es increíble, resuelve todas mis dudas.',
        rating: 5
      }
    ]
  }
}

const paymentMethods = [
  {
    id: 'credits',
    name: 'Créditos AIClases',
    description: 'Usa tus créditos acumulados',
    icon: Zap,
    recommended: true
  },
  {
    id: 'card',
    name: 'Tarjeta de Crédito/Débito',
    description: 'Visa, Mastercard, American Express',
    icon: CreditCard,
    recommended: false
  }
]

export default function EnrollPage({ params }: EnrollPageProps) {
  const [selectedPayment, setSelectedPayment] = useState('credits')
  const [isProcessing, setIsProcessing] = useState(false)
  const [userCredits] = useState(750) // Mock user credits
  
  const course = courseData[params.slug]
  
  if (!course) {
    notFound()
  }

  const hasEnoughCredits = userCredits >= course.price
  const discount = course.originalPrice - course.price

  const handleEnrollment = async () => {
    setIsProcessing(true)
    try {
      // TODO: Implement enrollment logic
      console.log('Enrolling in course:', course.id, 'Payment method:', selectedPayment)
      await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate payment processing
      
      // Redirect to success page or course
      window.location.href = `/learn/${course.slug}`
    } catch (error) {
      console.error('Enrollment error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" className="mb-4" asChild>
            <Link href={`/courses/${course.slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al curso
            </Link>
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">
            Inscribirse al Curso
          </h1>
          <p className="text-muted-foreground">
            Completa tu inscripción para comenzar a aprender
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Summary */}
            <Card className="p-6 glass-morphism border-0">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-2">{course.title}</h2>
                  <p className="text-muted-foreground mb-4">{course.description}</p>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary">{course.level}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration} horas
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course.lessons} lecciones
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.students.toLocaleString()} estudiantes
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6 glass-morphism border-0">
              <h3 className="text-xl font-semibold mb-4">Método de Pago</h3>
              
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPayment === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPayment(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <method.icon className="h-5 w-5 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{method.name}</span>
                            {method.recommended && (
                              <Badge variant="secondary" className="text-xs">
                                Recomendado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {method.description}
                          </p>
                          {method.id === 'credits' && (
                            <p className="text-sm text-muted-foreground">
                              Tienes {userCredits} créditos disponibles
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedPayment === method.id
                          ? 'border-primary bg-primary'
                          : 'border-muted'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>

              {selectedPayment === 'credits' && !hasEnoughCredits && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    No tienes suficientes créditos. Necesitas {course.price} créditos 
                    y tienes {userCredits}. Puedes comprar más créditos o usar otro método de pago.
                  </p>
                </div>
              )}
            </Card>

            {/* Security & Guarantees */}
            <Card className="p-6 glass-morphism border-0">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Seguridad y Garantías
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Pago Seguro</h4>
                    <p className="text-sm text-muted-foreground">
                      Transacciones encriptadas y protegidas
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Garantía 30 días</h4>
                    <p className="text-sm text-muted-foreground">
                      Devolución completa si no estás satisfecho
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Acceso de por vida</h4>
                    <p className="text-sm text-muted-foreground">
                      Sin límites de tiempo, para siempre
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Soporte incluido</h4>
                    <p className="text-sm text-muted-foreground">
                      Ayuda técnica cuando la necesites
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card className="p-6 glass-morphism border-0 sticky top-24">
              <h3 className="text-xl font-semibold mb-4">Resumen del Pedido</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Precio del curso</span>
                  <span className="line-through text-muted-foreground">
                    {course.originalPrice} créditos
                  </span>
                </div>
                
                <div className="flex justify-between text-green-600">
                  <span>Descuento especial</span>
                  <span>-{discount} créditos</span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">{course.price} créditos</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full glass-morphism text-lg py-6" 
                  onClick={handleEnrollment}
                  disabled={isProcessing || (selectedPayment === 'credits' && !hasEnoughCredits)}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Inscribirse Ahora
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Al inscribirte aceptas nuestros términos y condiciones
                </p>
              </div>
            </Card>

            {/* What's Included */}
            <Card className="p-6 glass-morphism border-0">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Qué Incluye
              </h3>
              
              <div className="space-y-3">
                {course.includes.map((item: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Progress Incentive */}
            <Card className="p-6 glass-morphism border-0">
              <h3 className="font-semibold mb-4">¡Solo quedan 3 cupos!</h3>
              <Progress value={85} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                85% de los cupos ya están ocupados. ¡No te quedes sin el tuyo!
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}