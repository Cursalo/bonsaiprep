import Link from 'next/link'
import { ArrowRight, BookOpen, Brain, Zap, Users, Star, Trophy, ChevronRight } from 'lucide-react'
import { Button } from '@ui/components/button'
import { Card } from '@ui/components/card'
import { Badge } from '@ui/components/badge'

const features = [
  {
    icon: Brain,
    title: 'IA Personalizada',
    description: 'Mentor AI que se adapta a tu ritmo de aprendizaje y estilo personal.'
  },
  {
    icon: BookOpen,
    title: 'Cursos Actualizados',
    description: 'Contenido que se actualiza automáticamente con las últimas tendencias en IA.'
  },
  {
    icon: Zap,
    title: 'Aprendizaje Acelerado',
    description: 'Metodología diseñada para maximizar la retención y aplicación práctica.'
  },
  {
    icon: Users,
    title: 'Comunidad Activa',
    description: 'Conecta con otros estudiantes y profesionales en nuestra plataforma.'
  }
]

const testimonials = [
  {
    name: 'María González',
    role: 'Data Scientist',
    content: 'AIClases cambió mi carrera. En 3 meses pasé de principiante a conseguir mi primer trabajo en IA.',
    rating: 5
  },
  {
    name: 'Carlos Rodríguez',
    role: 'Emprendedor',
    content: 'La calidad del contenido es excepcional. El Mentor AI realmente entiende mis necesidades.',
    rating: 5
  },
  {
    name: 'Ana Silva',
    role: 'Estudiante',
    content: 'Finalmente entiendo la IA de manera práctica. Los proyectos son increíbles.',
    rating: 5
  }
]

const stats = [
  { number: '10,000+', label: 'Estudiantes Activos' },
  { number: '50+', label: 'Cursos Disponibles' },
  { number: '95%', label: 'Tasa de Satisfacción' },
  { number: '24/7', label: 'Mentor AI Disponible' }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 px-4 py-2 glass-morphism">
              🚀 Plataforma #1 en Educación IA
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
              Domina la IA del
              <span className="block">Futuro Hoy</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Aprende Inteligencia Artificial con nuestro mentor AI personalizado,
              cursos actualizados en tiempo real y una comunidad de expertos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button size="lg" className="glass-morphism hover:scale-105 transition-all duration-300" asChild>
                <Link href="/register">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="glass-morphism" asChild>
                <Link href="/courses">
                  Ver Cursos
                  <BookOpen className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Por qué elegir AIClases?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Nuestra plataforma combina lo mejor de la educación tradicional
              con la innovación de la Inteligencia Artificial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 glass-morphism hover:scale-105 transition-all duration-300 border-0">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Lo que dicen nuestros estudiantes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Miles de profesionales han transformado su carrera con AIClases.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 glass-morphism border-0">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Card className="p-12 glass-morphism border-0 bg-gradient-to-r from-primary/10 to-secondary/10">
            <Trophy className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Listo para el siguiente nivel?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Únete a miles de profesionales que ya están construyendo el futuro con IA.
              Tu primer curso es completamente gratis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="glass-morphism hover:scale-105 transition-all duration-300" asChild>
                <Link href="/register">
                  Comenzar Ahora Gratis
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}