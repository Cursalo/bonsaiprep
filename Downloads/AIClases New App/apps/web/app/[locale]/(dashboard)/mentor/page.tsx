'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Zap, BookOpen, Code, Lightbulb, Trash2, Download } from 'lucide-react'
import { Button } from '@ui/components/button'
import { Card } from '@ui/components/card'
import { Input } from '@ui/components/input'
import { Badge } from '@ui/components/badge'
import { ScrollArea } from '@ui/components/scroll-area'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  creditsUsed?: number
}

const suggestedPrompts = [
  {
    icon: BookOpen,
    title: 'Explicar concepto',
    prompt: '¿Podrías explicarme qué es el machine learning de manera simple?'
  },
  {
    icon: Code,
    title: 'Ayuda con código',
    prompt: 'Ayúdame a escribir un algoritmo de clasificación en Python'
  },
  {
    icon: Lightbulb,
    title: 'Ideas de proyecto',
    prompt: '¿Qué proyecto de IA puedo hacer como principiante?'
  },
  {
    icon: Zap,
    title: 'Resolver ejercicio',
    prompt: 'Tengo dudas sobre este ejercicio de redes neuronales...'
  }
]

const exampleConversations = [
  {
    title: 'Introducción a ML',
    lastMessage: 'Perfecto, ahora entiendo la diferencia entre...',
    time: '2 horas'
  },
  {
    title: 'Proyecto de visión por computadora',
    lastMessage: 'Vamos a usar OpenCV para detectar...',
    time: '1 día'
  },
  {
    title: 'Algoritmos de optimización',
    lastMessage: 'El gradiente descendente funciona...',
    time: '3 días'
  }
]

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-primary text-white' 
          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-lg px-4 py-3 ${
          isUser 
            ? 'bg-primary text-white' 
            : 'bg-muted glass-morphism'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{message.timestamp.toLocaleTimeString()}</span>
          {message.creditsUsed && (
            <Badge variant="outline" className="text-xs">
              -{message.creditsUsed} créditos
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MentorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu Mentor AI personalizado 🤖\n\nEstoy aquí para ayudarte con cualquier duda sobre Inteligencia Artificial, Machine Learning, o tus cursos. Puedo:\n\n• Explicar conceptos complejos de manera simple\n• Ayudarte con código y ejercicios\n• Sugerir proyectos y recursos\n• Resolver dudas específicas sobre tus lecciones\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userCredits] = useState(150) // Mock credits
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Excelente pregunta! Te ayudo con eso.\n\n${inputValue.includes('código') 
          ? 'Aquí tienes un ejemplo práctico:\n\n```python\n# Ejemplo de código\nimport numpy as np\nfrom sklearn.model_selection import train_test_split\n\n# Tu código aquí\nprint("¡Hola, mundo de la IA!")\n```\n\n¿Te gustaría que te explique cada parte?'
          : 'Basándome en tu consulta sobre IA, puedo explicarte que esto se relaciona con varios conceptos fundamentales. Te recomiendo revisar la lección correspondiente en tu curso actual.\n\n¿Hay algún aspecto específico que te gustaría que profundice?'
        }`,
        timestamp: new Date(),
        creditsUsed: 5
      }

      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt)
  }

  const clearConversation = () => {
    setMessages([messages[0]]) // Keep only the welcome message
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/50 p-4 hidden lg:block">
        <div className="space-y-6">
          {/* Credits */}
          <Card className="p-4 glass-morphism border-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Tus Créditos</h3>
              <Badge variant="secondary" className="bg-primary text-white">
                <Zap className="h-3 w-3 mr-1" />
                {userCredits}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Cada pregunta consume 5 créditos aprox.
            </p>
          </Card>

          {/* Suggested Prompts */}
          <div>
            <h3 className="font-semibold mb-3">Sugerencias</h3>
            <div className="space-y-2">
              {suggestedPrompts.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(suggestion.prompt)}
                  className="w-full p-3 text-left rounded-lg border glass-morphism hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <suggestion.icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{suggestion.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div>
            <h3 className="font-semibold mb-3">Conversaciones</h3>
            <div className="space-y-2">
              {exampleConversations.map((conv, index) => (
                <div key={index} className="p-3 rounded-lg border glass-morphism">
                  <h4 className="font-medium text-sm mb-1">{conv.title}</h4>
                  <p className="text-xs text-muted-foreground mb-1">
                    {conv.lastMessage}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    hace {conv.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">Mentor AI</h1>
                <p className="text-sm text-muted-foreground">
                  Tu asistente personal de IA • Online
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearConversation}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3 glass-morphism">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-background/80 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pregúntame cualquier cosa sobre IA..."
                  className="glass-morphism"
                  disabled={isLoading}
                />
              </div>
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim() || isLoading}
                className="glass-morphism"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <p>Shift + Enter para nueva línea</p>
              <p>Créditos disponibles: {userCredits}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}