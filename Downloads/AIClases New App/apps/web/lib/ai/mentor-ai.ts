import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface MentorRequest {
  message: string
  context?: string
  userId: string
  courseContext?: string
}

export interface MentorResponse {
  answer: string
  suggestions: string[]
  confidence: number
}

export async function askMentorAI(request: MentorRequest): Promise<MentorResponse> {
  const systemPrompt = `Eres MentorAI, un asistente especializado en inteligencia artificial y educación. 

Contexto del curso: ${request.courseContext || 'General'}
Contexto de la lección: ${request.context || 'No disponible'}

Instrucciones:
1. Responde en español claro y educativo
2. Adapta tu respuesta al nivel del contexto proporcionado
3. Proporciona ejemplos prácticos cuando sea relevante
4. Si la pregunta está fuera del contexto de IA, redirige gentilmente al tema
5. Mantén las respuestas concisas pero completas (máximo 250 tokens)
6. Sugiere próximos pasos de aprendizaje cuando sea apropiado`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.message }
      ],
      max_tokens: 250,
      temperature: 0.7
    })

    const answer = completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu pregunta.'
    
    const suggestions = [
      '¿Podrías darme un ejemplo práctico?',
      '¿Cómo se relaciona esto con el mercado laboral?',
      '¿Qué recursos adicionales recomiendas?'
    ]

    return {
      answer,
      suggestions,
      confidence: 0.85
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error)
    
    return {
      answer: 'Lo siento, estoy experimentando dificultades técnicas. Por favor, intenta de nuevo en unos momentos.',
      suggestions: ['Intenta reformular tu pregunta', 'Consulta el contenido de la lección'],
      confidence: 0.1
    }
  }
}