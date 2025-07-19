'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  Loader2 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  title?: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss?: () => void
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => string
  dismissToast: (id: string) => void
  dismissAllToasts: () => void
  updateToast: (id: string, updates: Partial<Toast>) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
  maxToasts?: number
  defaultDuration?: number
}

export function ToastProvider({ 
  children, 
  maxToasts = 5, 
  defaultDuration = 5000 
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.type === 'loading' ? 0 : defaultDuration),
    }

    setToasts(prev => {
      const updated = [newToast, ...prev].slice(0, maxToasts)
      return updated
    })

    // Auto dismiss if not persistent and has duration
    if (!toast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, newToast.duration)
    }

    return id
  }, [defaultDuration, maxToasts])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id)
      if (toast?.onDismiss) {
        toast.onDismiss()
      }
      return prev.filter(t => t.id !== id)
    })
  }, [])

  const dismissAllToasts = useCallback(() => {
    setToasts(prev => {
      prev.forEach(toast => {
        if (toast.onDismiss) {
          toast.onDismiss()
        }
      })
      return []
    })
  }, [])

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id ? { ...toast, ...updates } : toast
      )
    )
  }, [])

  return (
    <ToastContext.Provider 
      value={{
        toasts,
        showToast,
        dismissToast,
        dismissAllToasts,
        updateToast,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastContainer() {
  const { toasts, dismissToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastComponentProps {
  toast: Toast
  onDismiss: () => void
}

function ToastComponent({ toast, onDismiss }: ToastComponentProps) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200 dark:border-green-800'
      case 'error':
        return 'border-red-200 dark:border-red-800'
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'border-blue-200 dark:border-blue-800'
      case 'loading':
        return 'border-blue-200 dark:border-blue-800'
      default:
        return 'border-gray-200 dark:border-gray-800'
    }
  }

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-950'
      case 'error':
        return 'bg-red-50 dark:bg-red-950'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-950'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950'
      case 'loading':
        return 'bg-blue-50 dark:bg-blue-950'
      default:
        return 'bg-white dark:bg-gray-900'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        duration: 0.3 
      }}
      className={cn(
        'glass-card border-l-4 p-4 shadow-lg backdrop-blur-sm',
        getBorderColor(),
        getBackgroundColor()
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {toast.title}
            </h4>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {toast.message}
          </p>
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {!toast.persistent && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Progress bar for timed toasts */}
      {toast.duration && toast.duration > 0 && !toast.persistent && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: "linear" }}
          className="absolute bottom-0 left-0 h-1 bg-current opacity-20 origin-left"
          style={{ width: '100%' }}
        />
      )}
    </motion.div>
  )
}

// Convenience hooks for common toast types
export function useSuccessToast() {
  const { showToast } = useToast()
  return useCallback((message: string, options?: Partial<Toast>) => {
    return showToast({ type: 'success', message, ...options })
  }, [showToast])
}

export function useErrorToast() {
  const { showToast } = useToast()
  return useCallback((message: string, options?: Partial<Toast>) => {
    return showToast({ type: 'error', message, ...options })
  }, [showToast])
}

export function useWarningToast() {
  const { showToast } = useToast()
  return useCallback((message: string, options?: Partial<Toast>) => {
    return showToast({ type: 'warning', message, ...options })
  }, [showToast])
}

export function useInfoToast() {
  const { showToast } = useToast()
  return useCallback((message: string, options?: Partial<Toast>) => {
    return showToast({ type: 'info', message, ...options })
  }, [showToast])
}

export function useLoadingToast() {
  const { showToast, updateToast, dismissToast } = useToast()
  
  return useCallback((message: string, options?: Partial<Toast>) => {
    const id = showToast({ 
      type: 'loading', 
      message, 
      persistent: true,
      ...options 
    })
    
    return {
      id,
      success: (successMessage: string) => {
        updateToast(id, { 
          type: 'success', 
          message: successMessage, 
          persistent: false,
          duration: 3000 
        })
        setTimeout(() => dismissToast(id), 3000)
      },
      error: (errorMessage: string) => {
        updateToast(id, { 
          type: 'error', 
          message: errorMessage, 
          persistent: false,
          duration: 5000 
        })
        setTimeout(() => dismissToast(id), 5000)
      },
      dismiss: () => dismissToast(id),
    }
  }, [showToast, updateToast, dismissToast])
}