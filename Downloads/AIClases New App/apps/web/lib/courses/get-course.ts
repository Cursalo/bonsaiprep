import { supabaseAdmin } from '@aiclases/database'
import { Course } from '@aiclases/shared'

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .select(`
      id,
      title,
      description,
      thumbnail,
      category,
      level,
      duration_hours,
      price_credits,
      published,
      created_at,
      updated_at,
      auto_update_version,
      lessons:lessons(
        id,
        title,
        description,
        order_index,
        duration_minutes,
        content,
        dynamic_content_blocks,
        published
      )
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error || !course) {
    return null
  }

  return {
    ...course,
    lessons: course.lessons.sort((a, b) => a.order_index - b.order_index)
  }
}

export async function getCourseProgress(courseId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('user_progress')
    .select('completed_lessons, total_lessons, last_lesson_id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single()

  return data
}