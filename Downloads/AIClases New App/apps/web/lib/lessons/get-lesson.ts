import { supabaseAdmin } from '@aiclases/database'
import { Lesson } from '@aiclases/shared'

export async function getLessonById(id: string): Promise<Lesson | null> {
  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .select(`
      id,
      title,
      description,
      content,
      order_index,
      duration_minutes,
      dynamic_content_blocks,
      published,
      course:courses(
        id,
        title,
        category,
        slug
      )
    `)
    .eq('id', id)
    .eq('published', true)
    .single()

  if (error || !lesson) {
    return null
  }

  return lesson
}

export async function getLessonNavigation(lessonId: string, courseId: string) {
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('id, title, order_index')
    .eq('course_id', courseId)
    .eq('published', true)
    .order('order_index')

  if (!lessons) return { previous: null, next: null }

  const currentIndex = lessons.findIndex(l => l.id === lessonId)
  
  return {
    previous: currentIndex > 0 ? lessons[currentIndex - 1] : null,
    next: currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  }
}