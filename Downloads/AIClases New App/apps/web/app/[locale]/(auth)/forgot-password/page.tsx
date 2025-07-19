'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@ui/components/button'
import { Card } from '@ui/components/card'
import { Input } from '@ui/components/input'
import { Label } from '@ui/components/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresa un email válido')
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    try {
      // TODO: Implement password reset logic
      console.log('Password reset request:', data)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      setEmailSent(true)
    } catch (error) {
      console.error('Password reset error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    const email = getValues('email')
    if (email) {
      setIsLoading(true)
      try {
        // TODO: Implement resend logic
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Resend error:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Email enviado
            </h1>
            <p className="text-muted-foreground">
              Hemos enviado las instrucciones para restablecer tu contraseña a{' '}
              <span className="font-medium text-foreground">{getValues('email')}</span>
            </p>
          </div>

          <Card className="p-8 glass-morphism border-0">
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <Mail className="h-12 w-12 text-primary mx-auto" />
                <div>
                  <h3 className="font-semibold mb-2">Revisa tu email</h3>
                  <p className="text-sm text-muted-foreground">
                    Te hemos enviado un enlace para restablecer tu contraseña. 
                    El enlace expira en 24 horas.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full glass-morphism"
                  onClick={handleResendEmail}
                  disabled={isLoading}
                >
                  {isLoading ? 'Reenviando...' : 'Reenviar email'}
                </Button>
                
                <Button variant="outline" className="w-full glass-morphism" asChild>
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio de sesión
                  </Link>
                </Button>
              </div>
            </div>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿No recibiste el email? Revisa tu carpeta de spam o{' '}
              <button 
                onClick={handleResendEmail}
                className="text-primary hover:underline font-medium"
                disabled={isLoading}
              >
                reenvíalo
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-muted-foreground">
            No te preocupes, te ayudamos a recuperar el acceso a tu cuenta
          </p>
        </div>

        <Card className="p-8 glass-morphism border-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="glass-morphism"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Ingresa el email asociado a tu cuenta de AIClases
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full glass-morphism" 
              disabled={isLoading}
            >
              {isLoading ? (
                'Enviando instrucciones...'
              ) : (
                <>
                  Enviar instrucciones
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="mt-6 p-6 glass-morphism border-0">
          <h3 className="font-semibold mb-3">¿Necesitas ayuda?</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Asegúrate de usar el email con el que te registraste</p>
            <p>• Revisa tu carpeta de spam o correo no deseado</p>
            <p>• El enlace de recuperación expira en 24 horas</p>
            <p>• Puedes solicitar un nuevo enlace las veces que necesites</p>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Si sigues teniendo problemas, contáctanos en{' '}
              <a 
                href="mailto:soporte@aiclases.com" 
                className="text-primary hover:underline"
              >
                soporte@aiclases.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}