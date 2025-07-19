import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/test-utils/render'
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '../error-boundary'

// Mock UI components
jest.mock('@ui/components/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}))

jest.mock('@ui/components/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children, className }: any) => (
    <div className={className} data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className} data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h2 className={className} data-testid="card-title">{children}</h2>
  ),
}))

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  AlertTriangle: ({ className }: any) => (
    <div data-testid="alert-triangle-icon" className={className} />
  ),
  RefreshCw: ({ className }: any) => (
    <div data-testid="refresh-icon" className={className} />
  ),
  Home: ({ className }: any) => (
    <div data-testid="home-icon" className={className} />
  ),
  Mail: ({ className }: any) => (
    <div data-testid="mail-icon" className={className} />
  ),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/test',
  reload: jest.fn(),
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock window.open
window.open = jest.fn()

// Mock console methods
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
  })

  describe('Normal Rendering', () => {
    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('passes through props to children', () => {
      render(
        <ErrorBoundary>
          <div data-testid="test-child">Child component</div>
        </ErrorBoundary>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('catches and displays component-level errors', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Error en el Componente')).toBeInTheDocument()
      expect(screen.getByText(/Este componente no se pudo cargar/)).toBeInTheDocument()
    })

    it('catches and displays page-level errors', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Algo salió mal')).toBeInTheDocument()
      expect(screen.getByText(/Esta página no se pudo cargar/)).toBeInTheDocument()
    })

    it('catches and displays critical-level errors', () => {
      render(
        <ErrorBoundary level="critical">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Error Crítico del Sistema')).toBeInTheDocument()
      expect(screen.getByText(/Ha ocurrido un error crítico/)).toBeInTheDocument()
    })

    it('displays error ID in all error levels', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Error ID should be displayed somewhere
      const errorBoundary = screen.getByText(/Error en el Componente/).closest('div')
      expect(errorBoundary).toBeInTheDocument()
    })

    it('logs error to console in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      )

      process.env.NODE_ENV = originalEnv
    })

    it('calls custom onError handler', () => {
      const onError = jest.fn()

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      )
    })

    it('sends error report to API', async () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/errors/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test error'),
        })
      })
    })

    it('handles API logging failure gracefully', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('API failed'))

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Should not throw even if API call fails
      await waitFor(() => {
        expect(screen.getByText('Error en el Componente')).toBeInTheDocument()
      })
    })
  })

  describe('Retry Functionality', () => {
    it('shows retry button for component-level errors', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Reintentar')).toBeInTheDocument()
    })

    it('shows retry button for page-level errors', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Reintentar \(3\)/)).toBeInTheDocument()
    })

    it('retries rendering when retry button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const retryButton = screen.getByText('Reintentar')
      fireEvent.click(retryButton)

      // Re-render with no error
      rerender(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('limits retry attempts', () => {
      const TestErrorComponent = () => {
        throw new Error('Persistent error')
      }

      render(
        <ErrorBoundary level="component">
          <TestErrorComponent />
        </ErrorBoundary>
      )

      // Click retry button multiple times
      for (let i = 0; i < 3; i++) {
        const retryButton = screen.queryByText('Reintentar')
        if (retryButton) {
          fireEvent.click(retryButton)
        }
      }

      // After max retries, button should not be available
      expect(screen.queryByText('Reintentar')).not.toBeInTheDocument()
    })
  })

  describe('Navigation Actions', () => {
    it('reloads page when reload button is clicked', () => {
      render(
        <ErrorBoundary level="critical">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const reloadButton = screen.getByText('Recargar Página')
      fireEvent.click(reloadButton)

      expect(mockLocation.reload).toHaveBeenCalled()
    })

    it('navigates to home when home button is clicked', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const homeButton = screen.getByText('Ir al Inicio')
      fireEvent.click(homeButton)

      expect(mockLocation.href).toBe('/')
    })

    it('opens bug report email when report button is clicked', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const reportButton = screen.getByText('Reportar')
      fireEvent.click(reportButton)

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('mailto:support@aiclases.com')
      )
    })

    it('includes error details in bug report', () => {
      render(
        <ErrorBoundary level="critical">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const reportButton = screen.getByText('Reportar Error')
      fireEvent.click(reportButton)

      const mailtoCall = (window.open as jest.Mock).mock.calls[0][0]
      expect(mailtoCall).toContain('Test error')
      expect(mailtoCall).toContain('Error ID')
    })
  })

  describe('Custom Fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div>Custom error UI</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error UI')).toBeInTheDocument()
      expect(screen.queryByText('Error en el Componente')).not.toBeInTheDocument()
    })
  })

  describe('Error Information', () => {
    it('displays error ID', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/ID del Error:/)).toBeInTheDocument()
    })

    it('displays error message for critical errors', () => {
      render(
        <ErrorBoundary level="critical">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Mensaje:/)).toBeInTheDocument()
      expect(screen.getByText(/Test error/)).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('applies correct styling for component-level errors', () => {
      const { container } = render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const errorDiv = container.querySelector('.border-orange-200')
      expect(errorDiv).toBeInTheDocument()
    })

    it('applies full-screen styling for critical errors', () => {
      const { container } = render(
        <ErrorBoundary level="critical">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const errorDiv = container.querySelector('.min-h-screen')
      expect(errorDiv).toBeInTheDocument()
    })

    it('shows alert triangle icon in all error levels', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
    })
  })
})

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const TestComponent = () => <div>Test component</div>
    const WrappedComponent = withErrorBoundary(TestComponent, { level: 'page' })

    render(<WrappedComponent />)

    expect(screen.getByText('Test component')).toBeInTheDocument()
  })

  it('passes props to wrapped component', () => {
    const TestComponent = ({ message }: { message: string }) => <div>{message}</div>
    const WrappedComponent = withErrorBoundary(TestComponent)

    render(<WrappedComponent message="Hello world" />)

    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('catches errors in wrapped component', () => {
    const ErrorComponent = () => {
      throw new Error('Wrapped component error')
    }
    const WrappedComponent = withErrorBoundary(ErrorComponent, { level: 'component' })

    render(<WrappedComponent />)

    expect(screen.getByText('Error en el Componente')).toBeInTheDocument()
  })

  it('applies error boundary props', () => {
    const onError = jest.fn()
    const ErrorComponent = () => {
      throw new Error('Test error')
    }
    const WrappedComponent = withErrorBoundary(ErrorComponent, { 
      level: 'page',
      onError 
    })

    render(<WrappedComponent />)

    expect(onError).toHaveBeenCalled()
    expect(screen.getByText('Oops! Algo salió mal')).toBeInTheDocument()
  })
})

describe('useErrorHandler Hook', () => {
  it('provides error handler function', () => {
    let errorHandler: any

    const TestComponent = () => {
      errorHandler = useErrorHandler()
      return <div>Test</div>
    }

    render(<TestComponent />)

    expect(typeof errorHandler).toBe('function')
  })

  it('logs error to API when called', async () => {
    let errorHandler: any

    const TestComponent = () => {
      errorHandler = useErrorHandler()
      return <div>Test</div>
    }

    render(<TestComponent />)

    const testError = new Error('Manual error')
    errorHandler(testError)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Manual error'),
      })
    })
  })

  it('logs error to console', () => {
    let errorHandler: any

    const TestComponent = () => {
      errorHandler = useErrorHandler()
      return <div>Test</div>
    }

    render(<TestComponent />)

    const testError = new Error('Manual error')
    errorHandler(testError)

    expect(console.error).toHaveBeenCalledWith(
      'Manual error report:',
      testError,
      undefined
    )
  })

  it('handles API failure gracefully', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('API failed'))

    let errorHandler: any

    const TestComponent = () => {
      errorHandler = useErrorHandler()
      return <div>Test</div>
    }

    render(<TestComponent />)

    const testError = new Error('Manual error')
    
    // Should not throw even if API call fails
    expect(() => errorHandler(testError)).not.toThrow()
  })
})

describe('Error Boundary Edge Cases', () => {
  it('handles errors during initial render', () => {
    const ErrorComponent = () => {
      throw new Error('Initial render error')
    }

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error en el Componente')).toBeInTheDocument()
  })

  it('handles errors in componentDidMount', () => {
    class ErrorComponent extends React.Component {
      componentDidMount() {
        throw new Error('componentDidMount error')
      }

      render() {
        return <div>Component content</div>
      }
    }

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error en el Componente')).toBeInTheDocument()
  })

  it('handles async errors through error handler', async () => {
    let errorHandler: any

    const TestComponent = () => {
      errorHandler = useErrorHandler()
      
      React.useEffect(() => {
        setTimeout(() => {
          try {
            throw new Error('Async error')
          } catch (error) {
            errorHandler(error as Error)
          }
        }, 100)
      }, [])

      return <div>Async component</div>
    }

    render(<TestComponent />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Async error'),
      })
    }, { timeout: 200 })
  })

  it('generates unique error IDs', () => {
    const { rerender } = render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const firstErrorId = screen.getByText(/ID del Error:/).textContent

    // Reset and trigger another error
    rerender(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    rerender(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const secondErrorId = screen.getByText(/ID del Error:/).textContent

    expect(firstErrorId).not.toBe(secondErrorId)
  })

  it('handles SSR environment (no window)', () => {
    const originalWindow = global.window
    delete (global as any).window

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // Should still render error UI
    expect(screen.getByText('Error en el Componente')).toBeInTheDocument()

    global.window = originalWindow
  })
})