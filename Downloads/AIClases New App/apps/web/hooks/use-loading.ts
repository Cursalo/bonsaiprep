'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useToast, useLoadingToast } from '@/components/toast/toast-provider'
import { 
  apiRequest, 
  ClientAPIException, 
  getErrorMessage, 
  getLocalizedErrorMessage 
} from '@/lib/error-handling/api-error-handler'

interface LoadingState {
  isLoading: boolean
  error: string | null
  data: any
}

interface UseLoadingOptions {
  showToast?: boolean
  loadingMessage?: string
  successMessage?: string
  errorMessage?: string
  onSuccess?: (data: any) => void
  onError?: (error: ClientAPIException) => void
  resetOnSuccess?: boolean
  resetErrorOnRetry?: boolean
}

export function useLoading<T = any>(initialData: T | null = null) {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: initialData,
  })
  
  const { showToast } = useToast()
  const loadingToast = useLoadingToast()
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentToastRef = useRef<any>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const execute = useCallback(async <R = T>(
    asyncFunction: (signal?: AbortSignal) => Promise<R>,
    options: UseLoadingOptions = {}
  ): Promise<R | null> => {
    const {
      showToast: shouldShowToast = false,
      loadingMessage = 'Cargando...',
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      resetOnSuccess = false,
      resetErrorOnRetry = true,
    } = options

    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: resetErrorOnRetry ? null : prev.error,
      }))

      // Show loading toast if requested
      if (shouldShowToast && loadingMessage) {
        currentToastRef.current = loadingToast(loadingMessage)
      }

      const result = await asyncFunction(signal)

      // Check if request was aborted
      if (signal.aborted) {
        return null
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        data: resetOnSuccess ? initialData : result,
      }))

      // Success toast
      if (shouldShowToast && successMessage) {
        if (currentToastRef.current) {
          currentToastRef.current.success(successMessage)
        } else {
          showToast({
            type: 'success',
            message: successMessage,
          })
        }
      }

      // Success callback
      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (error) {
      // Check if request was aborted
      if (signal.aborted) {
        return null
      }

      let errorMsg: string
      
      if (error instanceof ClientAPIException) {
        errorMsg = getLocalizedErrorMessage(error.error.code) || error.error.message
        if (onError) {
          onError(error)
        }
      } else {
        errorMsg = getErrorMessage(error)
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }))

      // Error toast
      if (shouldShowToast) {
        const finalErrorMessage = errorMessage || errorMsg
        if (currentToastRef.current) {
          currentToastRef.current.error(finalErrorMessage)
        } else {
          showToast({
            type: 'error',
            message: finalErrorMessage,
          })
        }
      }

      return null
    } finally {
      abortControllerRef.current = null
      currentToastRef.current = null
    }
  }, [showToast, loadingToast, initialData])

  const executeRequest = useCallback(async <R = T>(
    url: string,
    options: RequestInit = {},
    loadingOptions: UseLoadingOptions = {}
  ): Promise<R | null> => {
    return execute<R>(
      (signal) => apiRequest<R>(url, { ...options, signal }),
      loadingOptions
    )
  }, [execute])

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setState({
      isLoading: false,
      error: null,
      data: initialData,
    })
  }, [initialData])

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      error: null,
    }))
  }, [])

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false,
    }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }))
  }, [])

  return {
    ...state,
    execute,
    executeRequest,
    reset,
    setData,
    setError,
    clearError,
  }
}

// Specialized hook for form submissions
export function useFormSubmission<T = any>() {
  const { execute, isLoading, error, clearError } = useLoading<T>()

  const submit = useCallback(async (
    submitFunction: () => Promise<T>,
    options: UseLoadingOptions = {}
  ) => {
    const defaultOptions: UseLoadingOptions = {
      showToast: true,
      loadingMessage: 'Enviando...',
      successMessage: 'Guardado exitosamente',
      resetErrorOnRetry: true,
      ...options,
    }

    return execute(submitFunction, defaultOptions)
  }, [execute])

  return {
    submit,
    isSubmitting: isLoading,
    error,
    clearError,
  }
}

// Specialized hook for data fetching
export function useDataFetch<T = any>(initialData: T | null = null) {
  const { executeRequest, isLoading, error, data, reset, setError } = useLoading<T>(initialData)

  const fetch = useCallback(async (
    url: string,
    options: RequestInit = {},
    showErrorToast: boolean = false
  ) => {
    return executeRequest<T>(url, options, {
      showToast: showErrorToast,
      resetErrorOnRetry: true,
    })
  }, [executeRequest])

  const refetch = useCallback(async (
    url: string,
    options: RequestInit = {}
  ) => {
    return fetch(url, options, false)
  }, [fetch])

  return {
    fetch,
    refetch,
    isLoading,
    isFetching: isLoading,
    error,
    data,
    reset,
    setError,
  }
}

// Hook for async operations with manual control
export function useAsyncOperation() {
  const [operations, setOperations] = useState<Map<string, LoadingState>>(new Map())
  const { showToast } = useToast()
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  const startOperation = useCallback(async <T>(
    operationId: string,
    asyncFunction: (signal?: AbortSignal) => Promise<T>,
    options: UseLoadingOptions = {}
  ): Promise<T | null> => {
    const {
      showToast: shouldShowToast = false,
      loadingMessage,
      successMessage,
      errorMessage,
      onSuccess,
      onError,
    } = options

    // Cancel previous operation with same ID
    const existingController = abortControllersRef.current.get(operationId)
    if (existingController) {
      existingController.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    abortControllersRef.current.set(operationId, controller)

    try {
      setOperations(prev => new Map(prev.set(operationId, {
        isLoading: true,
        error: null,
        data: null,
      })))

      const result = await asyncFunction(controller.signal)

      if (controller.signal.aborted) {
        return null
      }

      setOperations(prev => new Map(prev.set(operationId, {
        isLoading: false,
        error: null,
        data: result,
      })))

      if (shouldShowToast && successMessage) {
        showToast({
          type: 'success',
          message: successMessage,
        })
      }

      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (error) {
      if (controller.signal.aborted) {
        return null
      }

      let errorMsg: string
      
      if (error instanceof ClientAPIException) {
        errorMsg = getLocalizedErrorMessage(error.error.code) || error.error.message
        if (onError) {
          onError(error)
        }
      } else {
        errorMsg = getErrorMessage(error)
      }

      setOperations(prev => new Map(prev.set(operationId, {
        isLoading: false,
        error: errorMsg,
        data: null,
      })))

      if (shouldShowToast) {
        showToast({
          type: 'error',
          message: errorMessage || errorMsg,
        })
      }

      return null
    } finally {
      abortControllersRef.current.delete(operationId)
    }
  }, [showToast])

  const cancelOperation = useCallback((operationId: string) => {
    const controller = abortControllersRef.current.get(operationId)
    if (controller) {
      controller.abort()
      abortControllersRef.current.delete(operationId)
    }
    setOperations(prev => {
      const newMap = new Map(prev)
      newMap.delete(operationId)
      return newMap
    })
  }, [])

  const getOperation = useCallback((operationId: string) => {
    return operations.get(operationId) || {
      isLoading: false,
      error: null,
      data: null,
    }
  }, [operations])

  const clearOperation = useCallback((operationId: string) => {
    setOperations(prev => {
      const newMap = new Map(prev)
      newMap.delete(operationId)
      return newMap
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => {
        controller.abort()
      })
      abortControllersRef.current.clear()
    }
  }, [])

  return {
    startOperation,
    cancelOperation,
    getOperation,
    clearOperation,
    operations: Object.fromEntries(operations),
  }
}