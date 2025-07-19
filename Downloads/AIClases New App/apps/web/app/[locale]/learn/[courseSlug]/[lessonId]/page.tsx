import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Play,
  MessageCircle,
  Download,
  Share2
} from 'lucide-react'
import { Button } from '@ui/components/button'
import { Card } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Progress } from '@ui/components/progress'

interface LessonPageProps {
  params: {
    courseSlug: string
    lessonId: string
  }
}

// Mock data - in production this would come from Supabase
const lessonData: Record<string, any> = {
  'fundamentos-ia': {
    course: {
      title: 'Fundamentos de Inteligencia Artificial',
      totalLessons: 12,
      userProgress: 8
    },
    lessons: {
      '1': {
        id: '1',
        title: '¿Qué es la Inteligencia Artificial?',
        description: 'Introducción a los conceptos fundamentales de la IA',
        duration: 25,
        order: 1,
        completed: true,
        content: `# ¿Qué es la Inteligencia Artificial?

La **Inteligencia Artificial** (IA) es una rama de la ciencia de la computación que se enfoca en crear sistemas capaces de realizar tareas que normalmente requieren inteligencia humana.

## Definición

La IA busca desarrollar algoritmos y sistemas que puedan:
- Aprender de datos
- Reconocer patrones
- Tomar decisiones
- Resolver problemas
- Adaptarse a nuevas situaciones

## Tipos de IA

### 1. IA Débil (Narrow AI)
- Diseñada para tareas específicas
- Ejemplos: Siri, recomendaciones de Netflix, filtros de spam

### 2. IA Fuerte (General AI)
- Inteligencia comparable a la humana
- Capaz de realizar cualquier tarea intelectual
- Aún no existe

## Aplicaciones Actuales

- **Reconocimiento de voz**: Asistentes virtuales
- **Visión por computadora**: Detección de objetos
- **Procesamiento de lenguaje**: Traducción automática
- **Sistemas de recomendación**: E-commerce, streaming

## Historia Rápida

- **1950**: Alan Turing propone el "Test de Turing"
- **1956**: Se acuña el término "Inteligencia Artificial"
- **1980s**: Surgen los sistemas expertos
- **2010s**: Boom del Deep Learning
- **2020s**: Era de los modelos de lenguaje masivos

## Ejercicio Práctico

Piensa en 3 aplicaciones de IA que uses en tu día a día. ¿Cómo crees que funcionan internamente?

## Recursos Adicionales

- [Artículo: Historia de la IA](https://example.com)
- [Video: ¿Qué es la IA?](https://example.com)
- [Podcast: El futuro de la IA](https://example.com)`,
        nextLesson: '2',
        previousLesson: null,
        resources: [
          {
            title: 'Slides de la lección',
            type: 'pdf',
            url: '/resources/lesson-1-slides.pdf'
          },
          {
            title: 'Código de ejemplo',
            type: 'code',
            url: '/resources/lesson-1-code.py'
          }
        ]
      },
      '2': {
        id: '2',
        title: 'Historia de la IA',
        description: 'Evolución desde Turing hasta ChatGPT',
        duration: 30,
        order: 2,
        completed: true,
        content: '# Historia de la IA\n\nContenido de la lección...',
        nextLesson: '3',
        previousLesson: '1',
        resources: []
      }
    }
  }
}

function LessonNavigation({ 
  previousLesson, 
  nextLesson, 
  courseSlug 
}: { 
  previousLesson: string | null
  nextLesson: string | null
  courseSlug: string 
}) {
  return (
    <div className="flex items-center justify-between">
      {previousLesson ? (
        <Button variant="outline" className="glass-morphism" asChild>
          <Link href={`/learn/${courseSlug}/${previousLesson}`}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Lección Anterior
          </Link>
        </Button>
      ) : (
        <div />
      )}

      {nextLesson ? (
        <Button className="glass-morphism" asChild>
          <Link href={`/learn/${courseSlug}/${nextLesson}`}>
            Siguiente Lección
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button className="glass-morphism">
          <CheckCircle className="mr-2 h-4 w-4" />
          Completar Curso
        </Button>
      )}
    </div>
  )
}

function LessonContent({ content }: { content: string }) {
  return (
    <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
      <div 
        className="leading-relaxed"
        dangerouslySetInnerHTML={{ 
          __html: content.replace(/\n/g, '<br />').replace(/\#\# /g, '<h2>').replace(/\# /g, '<h1>')
        }} 
      />
    </div>
  )
}

export default function LessonPage({ params }: LessonPageProps) {
  const courseData = lessonData[params.courseSlug]
  const lesson = courseData?.lessons[params.lessonId]
  
  if (!courseData || !lesson) {
    notFound()
  }

  const progressPercentage = (courseData.course.userProgress / courseData.course.totalLessons) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/learn/${params.courseSlug}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Volver al curso
                </Link>
              </Button>
              
              <div className="hidden md:block">
                <h1 className="font-semibold text-lg">{courseData.course.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Lección {lesson.order} de {courseData.course.totalLessons}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                {lesson.duration} min
              </div>
              
              <div className="w-32">
                <Progress value={progressPercentage} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  {Math.round(progressPercentage)}% completado
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Lesson Header */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">Lección {lesson.order}</Badge>
                {lesson.completed && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completada
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {lesson.title}
              </h1>
              
              <p className="text-xl text-muted-foreground mb-6">
                {lesson.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {lesson.duration} minutos
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  Lección {lesson.order}
                </div>
              </div>
            </div>

            {/* Lesson Content */}
            <Card className="p-8 glass-morphism border-0">
              <LessonContent content={lesson.content} />
            </Card>

            {/* Lesson Actions */}
            <Card className="p-6 glass-morphism border-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="glass-morphism">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Preguntar al Mentor AI
                  </Button>
                  <Button variant="outline" size="sm" className="glass-morphism">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                </div>
                
                {!lesson.completed && (
                  <Button className="glass-morphism">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Completada
                  </Button>
                )}
              </div>
            </Card>

            {/* Navigation */}
            <LessonNavigation 
              previousLesson={lesson.previousLesson}
              nextLesson={lesson.nextLesson}
              courseSlug={params.courseSlug}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Progress */}
            <Card className="p-6 glass-morphism border-0 sticky top-24">
              <h3 className="font-semibold mb-4">Progreso del Curso</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Completado</span>
                    <span>{courseData.course.userProgress}/{courseData.course.totalLessons}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
                
                <Button variant="outline" size="sm" className="w-full glass-morphism" asChild>
                  <Link href={`/learn/${params.courseSlug}`}>
                    Ver Todas las Lecciones
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Resources */}
            {lesson.resources && lesson.resources.length > 0 && (
              <Card className="p-6 glass-morphism border-0">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Recursos
                </h3>
                <div className="space-y-3">
                  {lesson.resources.map((resource: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium text-sm">{resource.title}</div>
                        <div className="text-xs text-muted-foreground uppercase">
                          {resource.type}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={resource.url} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="p-6 glass-morphism border-0">
              <h3 className="font-semibold mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start glass-morphism">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Mentor AI
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start glass-morphism">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Tomar Notas
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start glass-morphism">
                  <Play className="h-4 w-4 mr-2" />
                  Modo Foco
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}