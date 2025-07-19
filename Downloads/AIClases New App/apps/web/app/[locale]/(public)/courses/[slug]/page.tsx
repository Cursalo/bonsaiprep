'use client'

import { useState, useEffect } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Clock, 
  Users, 
  BookOpen, 
  Star, 
  Play, 
  CheckCircle, 
  Award,
  Target,
  User,
  Calendar,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'
import { Button } from '@ui/components/button'
import { Card } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Progress } from '@ui/components/progress'
import { ErrorBoundary } from '@/components/error-boundary/error-boundary'
import { 
  VideoPlayerSkeleton, 
  CourseCardSkeleton, 
  LessonListSkeleton,
  UserProfileSkeleton 
} from '@/components/loading/skeleton'
import { useDataFetch } from '@/hooks/use-loading'
import { useToast } from '@/components/toast/toast-provider'

interface CoursePageProps {
  params: {
    slug: string
  }
}

// Mock data - in production this would come from Supabase
const courseData: Record<string, any> = {
  'fundamentos-ia': {
    id: '1',
    title: 'Fundamentos de Inteligencia Artificial',
    description: 'Aprende los conceptos básicos de IA desde cero. Un curso completo para principiantes que cubre desde qué es la IA hasta sus aplicaciones prácticas en el mundo real.',
    longDescription: `
      Este curso está diseñado para llevarte desde cero conocimiento en IA hasta tener una comprensión sólida de los conceptos fundamentales. 
      
      Aprenderás sobre:
      - Historia y evolución de la Inteligencia Artificial
      - Tipos de IA y sus aplicaciones
      - Machine Learning y Deep Learning básico
      - Ética en la IA y consideraciones sociales
      - Herramientas prácticas para comenzar
      
      Al finalizar, tendrás las bases necesarias para especializar en áreas específicas de la IA.
    `,
    slug: 'fundamentos-ia',
    category: 'Fundamentos IA',
    level: 'Principiante',
    duration: 8,
    price: 600,
    rating: 4.9,
    students: 2340,
    lessons: 12,
    instructor: {
      name: 'Dr. María Elena Vázquez',
      bio: 'PhD en Ciencias de la Computación con 15 años de experiencia en IA. Ex-investigadora en Google DeepMind.',
      avatar: '/images/instructors/maria-vazquez.jpg'
    },
    objectives: [
      'Comprender qué es la Inteligencia Artificial y su historia',
      'Identificar diferentes tipos de IA y sus aplicaciones',
      'Conocer los conceptos básicos de Machine Learning',
      'Entender las implicaciones éticas de la IA',
      'Usar herramientas básicas de IA en proyectos prácticos'
    ],
    curriculum: [
      {
        id: 1,
        title: '¿Qué es la Inteligencia Artificial?',
        description: 'Introducción a los conceptos fundamentales de la IA',
        duration: 25,
        free: true
      },
      {
        id: 2,
        title: 'Historia de la IA',
        description: 'Evolución desde Turing hasta ChatGPT',
        duration: 30,
        free: false
      },
      {
        id: 3,
        title: 'Tipos de Aprendizaje Automático',
        description: 'Supervisado, no supervisado y por refuerzo',
        duration: 35,
        free: false
      },
      {
        id: 4,
        title: 'Redes Neuronales Básicas',
        description: 'Conceptos fundamentales de las redes neuronales',
        duration: 40,
        free: false
      },
      {
        id: 5,
        title: 'IA en la Vida Cotidiana',
        description: 'Aplicaciones prácticas que usas todos los días',
        duration: 20,
        free: false
      },
      {
        id: 6,
        title: 'Ética en la Inteligencia Artificial',
        description: 'Consideraciones éticas y sociales de la IA',
        duration: 35,
        free: false
      }
    ],
    prerequisites: [],
    tools: ['Python básico', 'Jupyter Notebooks', 'Google Colab'],
    certificates: true,
    updates: 'Contenido actualizado mensualmente con MCP Context7'
  }
}

function LessonItem({ lesson, index }: { lesson: any, index: number }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border glass-morphism hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
        {lesson.free ? (
          <Play className="h-4 w-4 text-primary" />
        ) : (
          <span className="text-sm font-medium text-primary">{index + 1}</span>
        )}
      </div>
      
      <div className="flex-1">
        <h4 className="font-medium mb-1">{lesson.title}</h4>
        <p className="text-sm text-muted-foreground">{lesson.description}</p>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        {lesson.duration} min
      </div>
      
      {lesson.free && (
        <Badge variant="secondary">Gratis</Badge>
      )}
    </div>
  )
}

function CourseLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <VideoPlayerSkeleton />
            <CourseCardSkeleton />
            <LessonListSkeleton count={6} />
          </div>
          <div className="space-y-6">
            <CourseCardSkeleton />
            <UserProfileSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}

function CourseContent({ course }: { course: any }) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 glass-morphism"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Cursos
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Header */}
            <ErrorBoundary level="component">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{course.category}</Badge>
                  <Badge variant="secondary" className="bg-green-500 text-white">
                    {course.level}
                  </Badge>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {course.title}
                </h1>
                
                <p className="text-xl text-muted-foreground mb-6">
                  {course.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{course.rating}</span>
                    <span className="text-muted-foreground">({course.students.toLocaleString()} estudiantes)</span>
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
                    <Calendar className="h-4 w-4" />
                    Actualizado: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </ErrorBoundary>

            {/* Course Description */}
            <ErrorBoundary level="component">
              <Card className="p-6 glass-morphism border-0">
                <h2 className="text-2xl font-semibold mb-4">Descripción del Curso</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {course.longDescription}
                  </p>
                </div>
              </Card>
            </ErrorBoundary>

            {/* Learning Objectives */}
            <ErrorBoundary level="component">
              <Card className="p-6 glass-morphism border-0">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  Lo que aprenderás
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {course.objectives.map((objective: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{objective}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </ErrorBoundary>

            {/* Instructor */}
            <ErrorBoundary level="component">
              <Card className="p-6 glass-morphism border-0">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <User className="h-6 w-6 text-primary" />
                  Tu Instructor
                </h2>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {course.instructor.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{course.instructor.name}</h3>
                    <p className="text-muted-foreground">{course.instructor.bio}</p>
                  </div>
                </div>
              </Card>
            </ErrorBoundary>

            {/* Curriculum */}
            <ErrorBoundary level="component">
              <Card className="p-6 glass-morphism border-0">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  Contenido del Curso
                </h2>
                <div className="space-y-2">
                  {course.curriculum.map((lesson: any, index: number) => (
                    <LessonItem key={lesson.id} lesson={lesson} index={index} />
                  ))}
                </div>
              </Card>
            </ErrorBoundary>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <ErrorBoundary level="component">
              <Card className="p-6 glass-morphism border-0 sticky top-24">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {course.price} créditos
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Acceso completo de por vida
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <Button size="lg" className="w-full glass-morphism hover:scale-105 transition-all duration-300" asChild>
                    <Link href="/register">
                      Inscribirse Ahora
                    </Link>
                  </Button>
                  
                  <Button variant="outline" size="lg" className="w-full glass-morphism" asChild>
                    <Link href={`/courses/${course.slug}/preview`}>
                      Vista Previa Gratis
                    </Link>
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground mb-6">
                  💰 Garantía de devolución de 30 días
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span>Nivel:</span>
                    <span className="font-medium">{course.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duración:</span>
                    <span className="font-medium">{course.duration} horas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lecciones:</span>
                    <span className="font-medium">{course.lessons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Certificado:</span>
                    <span className="font-medium">✅ Incluido</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actualizaciones:</span>
                    <span className="font-medium">🤖 Automáticas</span>
                  </div>
                </div>
              </Card>
            </ErrorBoundary>

            {/* Course Features */}
            <ErrorBoundary level="component">
              <Card className="p-6 glass-morphism border-0">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Incluye
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Acceso de por vida
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Certificado verificable
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Proyectos prácticos
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Mentor AI 24/7
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Comunidad exclusiva
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Actualizaciones automáticas
                  </div>
                </div>
              </Card>
            </ErrorBoundary>

            {/* Progress if enrolled */}
            <ErrorBoundary level="component">
              <Card className="p-6 glass-morphism border-0">
                <h3 className="font-semibold mb-4">Tu Progreso</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Completado</span>
                    <span>0 / {course.lessons}</span>
                  </div>
                  <Progress value={0} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">
                    Inscríbete para comenzar tu progreso
                  </div>
                </div>
              </Card>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CoursePage({ params }: CoursePageProps) {
  const { data: course, isLoading, error, fetch } = useDataFetch(null)
  const showToast = useToast()

  useEffect(() => {
    loadCourse()
  }, [params.slug])

  const loadCourse = async () => {
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 600))
    
    // Mock data - in production this would come from Supabase
    const courseData: Record<string, any> = {
      'fundamentos-ia': {
        id: '1',
        title: 'Fundamentos de Inteligencia Artificial',
        description: 'Aprende los conceptos básicos de IA desde cero. Un curso completo para principiantes que cubre desde qué es la IA hasta sus aplicaciones prácticas en el mundo real.',
        longDescription: `
          Este curso está diseñado para llevarte desde cero conocimiento en IA hasta tener una comprensión sólida de los conceptos fundamentales. 
          
          Aprenderás sobre:
          - Historia y evolución de la Inteligencia Artificial
          - Tipos de IA y sus aplicaciones
          - Machine Learning y Deep Learning básico
          - Ética en la IA y consideraciones sociales
          - Herramientas prácticas para comenzar
          
          Al finalizar, tendrás las bases necesarias para especializar en áreas específicas de la IA.
        `,
        slug: 'fundamentos-ia',
        category: 'Fundamentos IA',
        level: 'Principiante',
        duration: 8,
        price: 600,
        rating: 4.9,
        students: 2340,
        lessons: 12,
        instructor: {
          name: 'Dr. María Elena Vázquez',
          bio: 'PhD en Ciencias de la Computación con 15 años de experiencia en IA. Ex-investigadora en Google DeepMind.',
          avatar: '/images/instructors/maria-vazquez.jpg'
        },
        objectives: [
          'Comprender qué es la Inteligencia Artificial y su historia',
          'Identificar diferentes tipos de IA y sus aplicaciones',
          'Conocer los conceptos básicos de Machine Learning',
          'Entender las implicaciones éticas de la IA',
          'Usar herramientas básicas de IA en proyectos prácticos'
        ],
        curriculum: [
          {
            id: 1,
            title: '¿Qué es la Inteligencia Artificial?',
            description: 'Introducción a los conceptos fundamentales de la IA',
            duration: 25,
            free: true
          },
          {
            id: 2,
            title: 'Historia de la IA',
            description: 'Evolución desde Turing hasta ChatGPT',
            duration: 30,
            free: false
          },
          {
            id: 3,
            title: 'Tipos de Aprendizaje Automático',
            description: 'Supervisado, no supervisado y por refuerzo',
            duration: 35,
            free: false
          },
          {
            id: 4,
            title: 'Redes Neuronales Básicas',
            description: 'Conceptos fundamentales de las redes neuronales',
            duration: 40,
            free: false
          },
          {
            id: 5,
            title: 'IA en la Vida Cotidiana',
            description: 'Aplicaciones prácticas que usas todos los días',
            duration: 20,
            free: false
          },
          {
            id: 6,
            title: 'Ética en la Inteligencia Artificial',
            description: 'Consideraciones éticas y sociales de la IA',
            duration: 35,
            free: false
          }
        ],
        prerequisites: [],
        tools: ['Python básico', 'Jupyter Notebooks', 'Google Colab'],
        certificates: true,
        updates: 'Contenido actualizado mensualmente con MCP Context7'
      }
    }

    const foundCourse = courseData[params.slug]
    if (!foundCourse) {
      throw new Error('Course not found')
    }

    return foundCourse
  }

  if (isLoading) {
    return <CourseLoadingSkeleton />
  }

  if (error) {
    return (
      <ErrorBoundary level="page">
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20">
          <div className="container mx-auto max-w-7xl px-4 py-12">
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-semibold mb-2">Curso no encontrado</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => loadCourse()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
                <Button asChild>
                  <Link href="/courses">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a Cursos
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  if (!course) {
    notFound()
  }

  return (
    <ErrorBoundary level="page">
      <CourseContent course={course} />
    </ErrorBoundary>
  )
}