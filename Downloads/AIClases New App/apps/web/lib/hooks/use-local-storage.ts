'use client'

import { useState, useEffect, useCallback } from 'react'

type SetValue<T> = T | ((val: T) => T)

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        
        // Save state
        setStoredValue(valueToStore)
        
        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
          
          // Dispatch a custom event to notify other components
          window.dispatchEvent(
            new CustomEvent('localStorage', {
              detail: {
                key,
                newValue: valueToStore,
              },
            })
          )
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  // Function to remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
        window.dispatchEvent(
          new CustomEvent('localStorage', {
            detail: {
              key,
              newValue: null,
            },
          })
        )
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Listen for changes to this localStorage key from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue)
          setStoredValue(newValue)
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error)
        }
      }
    }

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail?.key === key) {
        setStoredValue(e.detail.newValue ?? initialValue)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      window.addEventListener('localStorage', handleCustomStorageChange as EventListener)
      
      return () => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('localStorage', handleCustomStorageChange as EventListener)
      }
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

// Session storage hook
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

// Hook for checking localStorage availability
export function useLocalStorageAvailable(): boolean {
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    try {
      const testKey = '__localStorage_test__'
      window.localStorage.setItem(testKey, 'test')
      window.localStorage.removeItem(testKey)
      setIsAvailable(true)
    } catch {
      setIsAvailable(false)
    }
  }, [])

  return isAvailable
}

// Clear all localStorage data for the app
export function clearAppStorage() {
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage)
    const appKeys = keys.filter(key => 
      key.startsWith('aiclases-') || 
      key.startsWith('pwa-') ||
      key.startsWith('user-') ||
      key.startsWith('course-') ||
      key.startsWith('mentor-')
    )
    
    appKeys.forEach(key => {
      localStorage.removeItem(key)
    })
  }
}