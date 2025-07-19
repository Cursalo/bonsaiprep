import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { WifiOff, RefreshCw, Home, BookOpen, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sin Conexión | AIClases 4.0',
  description: 'No hay conexión a internet disponible',
  robots: {
    index: false,
    follow: false,
  },
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/95 to-muted/20">
      <Card className="w-full max-w-md mx-auto bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 bg-muted/50 rounded-full w-fit">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Sin Conexión</CardTitle>
          <CardDescription className="text-base">
            No se puede conectar a internet en este momento
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Verifica tu conexión a internet y vuelve a intentarlo
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              asChild
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Ir al Inicio
              </Link>
            </Button>
          </div>

          {/* Offline Features */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3 text-center">
              Funciones Disponibles Sin Conexión
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Cursos descargados previamente</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span>Historial de chat con MentorAI</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-sm">Consejos:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Verifica que WiFi esté activado</li>
              <li>• Revisa tu conexión de datos móviles</li>
              <li>• Intenta moverte a una zona con mejor señal</li>
              <li>• Reinicia tu router si es necesario</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}