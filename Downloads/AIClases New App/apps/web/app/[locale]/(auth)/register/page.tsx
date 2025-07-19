'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, Github, Mail, Check } from 'lucide-react'
import { Button } from '@ui/components/button'
import { Card } from '@ui/components/card'
import { Input } from '@ui/components/input'
import { Label } from '@ui/components/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar los términos y condiciones'
  }),
  subscribeNewsletter: z.boolean().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

type RegisterForm = z.infer<typeof registerSchema>

const passwordRequirements = [
  { label: 'Al menos 8 caracteres', regex: /.{8,}/ },
  { label: 'Una letra mayúscula', regex: /[A-Z]/ },
  { label: 'Una letra minúscula', regex: /[a-z]/ },
  { label: 'Un número', regex: /\d/ }
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const passwordValue = watch('password', '')

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      // TODO: Implement registration logic
      console.log('Register attempt:', data)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Crea tu cuenta
          </h1>
          <p className="text-muted-foreground">
            Únete a miles de estudiantes que ya dominan la IA
          </p>
        </div>

        <Card className="p-8 glass-morphism border-0">
          {/* Social Registration */}
          <div className="space-y-3 mb-6">
            <Button variant="outline" className="w-full glass-morphism" disabled={isLoading}>
              <Github className="h-4 w-4 mr-2" />
              Registrarse con GitHub
            </Button>
            <Button variant="outline" className="w-full glass-morphism" disabled={isLoading}>
              <Mail className="h-4 w-4 mr-2" />
              Registrarse con Google
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O registrarse con email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Tu nombre completo"
                className="glass-morphism"
                {...register('fullName')}
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="glass-morphism pr-10"
                  {...register('password')}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Password Requirements */}
              {passwordValue && (
                <div className="space-y-1 mt-2">
                  {passwordRequirements.map((requirement, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <Check 
                        className={`h-3 w-3 ${
                          requirement.regex.test(passwordValue) 
                            ? 'text-green-500' 
                            : 'text-muted-foreground'
                        }`} 
                      />
                      <span className={
                        requirement.regex.test(passwordValue) 
                          ? 'text-green-500' 
                          : 'text-muted-foreground'
                      }>
                        {requirement.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="glass-morphism pr-10"
                  {...register('confirmPassword')}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  className="rounded border-gray-300 mt-1"
                  {...register('acceptTerms')}
                  disabled={isLoading}
                />
                <Label htmlFor="acceptTerms" className="text-sm leading-5">
                  Acepto los{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    términos y condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    política de privacidad
                  </Link>
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
              )}

              <div className="flex items-center space-x-2">
                <input
                  id="subscribeNewsletter"
                  type="checkbox"
                  className="rounded border-gray-300"
                  {...register('subscribeNewsletter')}
                  disabled={isLoading}
                />
                <Label htmlFor="subscribeNewsletter" className="text-sm">
                  Quiero recibir noticias y actualizaciones sobre nuevos cursos
                </Label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full glass-morphism" 
              disabled={isLoading}
            >
              {isLoading ? (
                'Creando cuenta...'
              ) : (
                <>
                  Crear Cuenta Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </Card>

        {/* Benefits */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            ✅ Primer curso completamente gratis
          </p>
          <p className="text-sm text-muted-foreground">
            🎓 Certificados verificables en blockchain
          </p>
          <p className="text-sm text-muted-foreground">
            💬 Acceso a la comunidad de estudiantes
          </p>
        </div>
      </div>
    </div>
  )
}