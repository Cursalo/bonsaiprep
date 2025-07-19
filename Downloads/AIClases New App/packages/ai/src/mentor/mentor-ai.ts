import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface MentorRequest {
  message: string
  context?: string
  userId: string
  courseContext?: string
  lessonContext?: string
}

export interface MentorResponse {
  answer: string
  suggestions: string[]
  confidence: number
  creditsUsed: number
}

export async function askMentorAI(request: MentorRequest): Promise<MentorResponse> {
  const systemPrompt = `Eres MentorAI, un asistente especializado en inteligencia artificial y educación. 

Contexto del curso: ${request.courseContext || 'General'}
Contexto de la lección: ${request.lessonContext || 'No disponible'}
Contexto adicional: ${request.context || 'No disponible'}

Instrucciones:
1. Responde en español claro y educativo
2. Adapta tu respuesta al nivel del contexto proporcionado
3. Proporciona ejemplos prácticos cuando sea relevante
4. Si la pregunta está fuera del contexto de IA, redirige gentilmente al tema
5. Mantén las respuestas concisas pero completas (máximo 300 tokens)
6. Sugiere próximos pasos de aprendizaje cuando sea apropiado
7. Si necesitas más información, haz preguntas específicas

Tu objetivo es guiar al estudiante hacia una comprensión más profunda de la inteligencia artificial.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.message }
      ],
      max_tokens: 300,
      temperature: 0.7
    })

    const answer = completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu pregunta.'
    
    const suggestions = generateSuggestions(request.message, answer)

    return {
      answer,
      suggestions,
      confidence: 0.85,
      creditsUsed: 3
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error)
    
    return {
      answer: 'Lo siento, estoy experimentando dificultades técnicas. Por favor, intenta de nuevo en unos momentos.',
      suggestions: ['Intenta reformular tu pregunta', 'Consulta el contenido de la lección'],
      confidence: 0.1,
      creditsUsed: 0
    }
  }
}

function generateSuggestions(originalMessage: string, answer: string): string[] {
  const baseSuggestions = [
    '¿Podrías darme un ejemplo práctico?',
    '¿Cómo se relaciona esto con el mercado laboral?',
    '¿Qué recursos adicionales recomiendas?',
    '¿Cuáles son los próximos pasos?',
    'Explícame esto de manera más simple'
  ]

  // Simple logic to return relevant suggestions
  if (originalMessage.toLowerCase().includes('código') || originalMessage.toLowerCase().includes('programar')) {
    return [
      '¿Podrías mostrarme un ejemplo de código?',
      '¿Qué librerías recomiendas para esto?',
      '¿Cómo puedo practicar esto?'
    ]
  }

  if (originalMessage.toLowerCase().includes('carrera') || originalMessage.toLowerCase().includes('trabajo')) {
    return [
      '¿Qué habilidades son más demandadas?',
      '¿Cómo puedo crear un portafolio?',
      '¿Qué certificaciones recomiendas?'
    ]
  }

  return baseSuggestions.slice(0, 3)
}