'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'
import { Button } from '@ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'critical'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Log error to monitoring service (replace with your monitoring solution)
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        level: this.props.level || 'component',
      }

      // Send to your error logging service
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      }).catch(() => {
        // Silently fail if error logging fails
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
      })
    }
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  private reportBug = () => {
    const subject = `Error Report - ${this.state.errorId}`
    const body = `
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
URL: ${typeof window !== 'undefined' ? window.location.href : ''}
Timestamp: ${new Date().toISOString()}

Stack Trace:
${this.state.error?.stack}

Component Stack:
${this.state.errorInfo?.componentStack}
    `.trim()
    
    const mailtoUrl = `mailto:support@aiclases.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    if (typeof window !== 'undefined') {
      window.open(mailtoUrl)
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Different error UIs based on level
      const level = this.props.level || 'component'

      if (level === 'critical') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <Card className="w-full max-w-lg mx-4">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-2xl text-red-800 dark:text-red-200">
                  Error Crítico del Sistema
                </CardTitle>
                <CardDescription className="text-red-600 dark:text-red-400">
                  Ha ocurrido un error crítico. Por favor, recarga la página o contacta soporte.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p><strong>ID del Error:</strong> {this.state.errorId}</p>
                  <p><strong>Mensaje:</strong> {this.state.error?.message}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={this.handleReload} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recargar Página
                  </Button>
                  <Button variant="outline" onClick={this.reportBug} className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    Reportar Error
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      if (level === 'page') {
        return (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-xl">Oops! Algo salió mal</CardTitle>
                <CardDescription>
                  Esta página no se pudo cargar correctamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground text-center">
                  ID del Error: <code className="bg-muted px-1 rounded">{this.state.errorId}</code>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {this.retryCount < this.maxRetries && (
                    <Button onClick={this.handleRetry} variant="outline" className="flex-1">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reintentar ({this.maxRetries - this.retryCount})
                    </Button>
                  )}
                  <Button onClick={this.handleGoHome} className="flex-1">
                    <Home className="w-4 h-4 mr-2" />
                    Ir al Inicio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      // Component level error
      return (
        <div className="p-4 border border-orange-200 rounded-lg bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-orange-800 dark:text-orange-200">
                Error en el Componente
              </h3>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Este componente no se pudo cargar. Intenta recargar la página.
              </p>
              <div className="mt-3 flex gap-2">
                {this.retryCount < this.maxRetries && (
                  <Button onClick={this.handleRetry} size="sm" variant="outline">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reintentar
                  </Button>
                )}
                <Button onClick={this.reportBug} size="sm" variant="ghost">
                  <Mail className="w-3 h-3 mr-1" />
                  Reportar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook for error reporting from functional components
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    console.error('Manual error report:', error, errorInfo)
    
    // Create artificial error boundary state for logging
    const errorId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorId,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        level: 'manual',
      }),
    }).catch(() => {
      // Silently fail
    })
  }, [])
}