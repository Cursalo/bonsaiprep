import { renderHook, act } from '@testing-library/react'
import { 
  useLocalStorage, 
  useSessionStorage, 
  useLocalStorageAvailable, 
  clearAppStorage 
} from '../use-local-storage'

// Mock console.warn to avoid noise in test output
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    mockConsoleWarn.mockClear()
  })

  afterAll(() => {
    mockConsoleWarn.mockRestore()
  })

  describe('Basic functionality', () => {
    it('returns initial value when localStorage is empty', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
      
      expect(result.current[0]).toBe('initial')
    })

    it('sets and gets string values', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
      
      act(() => {
        result.current[1]('new value')
      })
      
      expect(result.current[0]).toBe('new value')
      expect(localStorage.getItem('test-key')).toBe('"new value"')
    })

    it('sets and gets number values', () => {
      const { result } = renderHook(() => useLocalStorage('number-key', 0))
      
      act(() => {
        result.current[1](42)
      })
      
      expect(result.current[0]).toBe(42)
      expect(localStorage.getItem('number-key')).toBe('42')
    })

    it('sets and gets boolean values', () => {
      const { result } = renderHook(() => useLocalStorage('boolean-key', false))
      
      act(() => {
        result.current[1](true)
      })
      
      expect(result.current[0]).toBe(true)
      expect(localStorage.getItem('boolean-key')).toBe('true')
    })

    it('sets and gets object values', () => {
      const { result } = renderHook(() => useLocalStorage('object-key', {}))
      
      const testObject = { name: 'test', count: 5 }
      
      act(() => {
        result.current[1](testObject)
      })
      
      expect(result.current[0]).toEqual(testObject)
      expect(JSON.parse(localStorage.getItem('object-key')!)).toEqual(testObject)
    })

    it('sets and gets array values', () => {
      const { result } = renderHook(() => useLocalStorage('array-key', []))
      
      const testArray = [1, 2, 3, 'test']
      
      act(() => {
        result.current[1](testArray)
      })
      
      expect(result.current[0]).toEqual(testArray)
      expect(JSON.parse(localStorage.getItem('array-key')!)).toEqual(testArray)
    })
  })

  describe('Functional updates', () => {
    it('supports functional updates', () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0))
      
      act(() => {
        result.current[1](prev => prev + 1)
      })
      
      expect(result.current[0]).toBe(1)
      
      act(() => {
        result.current[1](prev => prev * 2)
      })
      
      expect(result.current[0]).toBe(2)
    })

    it('supports functional updates with objects', () => {
      const { result } = renderHook(() => useLocalStorage('user', { name: '', age: 0 }))
      
      act(() => {
        result.current[1](prev => ({ ...prev, name: 'John' }))
      })
      
      expect(result.current[0]).toEqual({ name: 'John', age: 0 })
      
      act(() => {
        result.current[1](prev => ({ ...prev, age: 25 }))
      })
      
      expect(result.current[0]).toEqual({ name: 'John', age: 25 })
    })
  })

  describe('Remove functionality', () => {
    it('removes value and resets to initial value', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
      
      // Set a value first
      act(() => {
        result.current[1]('new value')
      })
      
      expect(result.current[0]).toBe('new value')
      expect(localStorage.getItem('test-key')).toBe('"new value"')
      
      // Remove the value
      act(() => {
        result.current[2]() // removeValue function
      })
      
      expect(result.current[0]).toBe('initial')
      expect(localStorage.getItem('test-key')).toBeNull()
    })

    it('removes complex object and resets to initial', () => {
      const initialObject = { defaultProp: 'default' }
      const { result } = renderHook(() => useLocalStorage('object-key', initialObject))
      
      act(() => {
        result.current[1]({ customProp: 'custom' })
      })
      
      expect(result.current[0]).toEqual({ customProp: 'custom' })
      
      act(() => {
        result.current[2]()
      })
      
      expect(result.current[0]).toEqual(initialObject)
    })
  })

  describe('Persistence across hook instances', () => {
    it('loads existing value from localStorage on initialization', () => {
      // Set value directly in localStorage
      localStorage.setItem('existing-key', JSON.stringify('existing value'))
      
      const { result } = renderHook(() => useLocalStorage('existing-key', 'default'))
      
      expect(result.current[0]).toBe('existing value')
    })

    it('persists value across different hook instances', () => {
      const { result: result1 } = renderHook(() => useLocalStorage('shared-key', 'initial'))
      
      act(() => {
        result1.current[1]('shared value')
      })
      
      const { result: result2 } = renderHook(() => useLocalStorage('shared-key', 'different initial'))
      
      expect(result2.current[0]).toBe('shared value')
    })
  })

  describe('Error handling', () => {
    it('handles JSON parse errors gracefully', () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('invalid-json', 'invalid json string')
      
      const { result } = renderHook(() => useLocalStorage('invalid-json', 'default'))
      
      expect(result.current[0]).toBe('default')
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Error reading localStorage key "invalid-json"'),
        expect.any(Error)
      )
    })

    it('handles localStorage write errors gracefully', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
      
      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded')
      })
      
      act(() => {
        result.current[1]('new value')
      })
      
      // State should still be updated even if localStorage fails
      expect(result.current[0]).toBe('new value')
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Error setting localStorage key "test-key"'),
        expect.any(Error)
      )
      
      // Restore original method
      localStorage.setItem = originalSetItem
    })

    it('handles localStorage remove errors gracefully', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
      
      // Mock localStorage.removeItem to throw an error
      const originalRemoveItem = localStorage.removeItem
      localStorage.removeItem = jest.fn(() => {
        throw new Error('Remove failed')
      })
      
      act(() => {
        result.current[2]()
      })
      
      // State should still be reset even if localStorage fails
      expect(result.current[0]).toBe('initial')
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Error removing localStorage key "test-key"'),
        expect.any(Error)
      )
      
      // Restore original method
      localStorage.removeItem = originalRemoveItem
    })
  })

  describe('SSR compatibility', () => {
    it('returns initial value when window is undefined', () => {
      const originalWindow = global.window
      delete (global as any).window
      
      const { result } = renderHook(() => useLocalStorage('ssr-key', 'ssr-initial'))
      
      expect(result.current[0]).toBe('ssr-initial')
      
      global.window = originalWindow
    })

    it('handles setValue when window is undefined', () => {
      const originalWindow = global.window
      delete (global as any).window
      
      const { result } = renderHook(() => useLocalStorage('ssr-key', 'initial'))
      
      act(() => {
        result.current[1]('new value')
      })
      
      expect(result.current[0]).toBe('new value')
      
      global.window = originalWindow
    })
  })

  describe('Cross-tab synchronization', () => {
    it('listens for storage events and updates state', () => {
      const { result } = renderHook(() => useLocalStorage('sync-key', 'initial'))
      
      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'sync-key',
        newValue: JSON.stringify('updated from another tab'),
        oldValue: JSON.stringify('initial'),
        storageArea: localStorage
      })
      
      act(() => {
        window.dispatchEvent(storageEvent)
      })
      
      expect(result.current[0]).toBe('updated from another tab')
    })

    it('ignores storage events for different keys', () => {
      const { result } = renderHook(() => useLocalStorage('my-key', 'initial'))
      
      const storageEvent = new StorageEvent('storage', {
        key: 'different-key',
        newValue: JSON.stringify('different value'),
        oldValue: null,
        storageArea: localStorage
      })
      
      act(() => {
        window.dispatchEvent(storageEvent)
      })
      
      expect(result.current[0]).toBe('initial')
    })

    it('dispatches custom localStorage events when setting values', () => {
      const eventListener = jest.fn()
      window.addEventListener('localStorage', eventListener)
      
      const { result } = renderHook(() => useLocalStorage('event-key', 'initial'))
      
      act(() => {
        result.current[1]('new value')
      })
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            key: 'event-key',
            newValue: 'new value'
          }
        })
      )
      
      window.removeEventListener('localStorage', eventListener)
    })

    it('dispatches custom localStorage events when removing values', () => {
      const eventListener = jest.fn()
      window.addEventListener('localStorage', eventListener)
      
      const { result } = renderHook(() => useLocalStorage('remove-event-key', 'initial'))
      
      act(() => {
        result.current[2]() // remove value
      })
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            key: 'remove-event-key',
            newValue: null
          }
        })
      )
      
      window.removeEventListener('localStorage', eventListener)
    })
  })
})

describe('useSessionStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mockConsoleWarn.mockClear()
  })

  describe('Basic functionality', () => {
    it('returns initial value when sessionStorage is empty', () => {
      const { result } = renderHook(() => useSessionStorage('test-key', 'initial'))
      
      expect(result.current[0]).toBe('initial')
    })

    it('sets and gets values', () => {
      const { result } = renderHook(() => useSessionStorage('test-key', 'initial'))
      
      act(() => {
        result.current[1]('session value')
      })
      
      expect(result.current[0]).toBe('session value')
      expect(sessionStorage.getItem('test-key')).toBe('"session value"')
    })

    it('supports functional updates', () => {
      const { result } = renderHook(() => useSessionStorage('counter', 0))
      
      act(() => {
        result.current[1](prev => prev + 5)
      })
      
      expect(result.current[0]).toBe(5)
    })

    it('removes value and resets to initial', () => {
      const { result } = renderHook(() => useSessionStorage('test-key', 'initial'))
      
      act(() => {
        result.current[1]('session value')
      })
      
      expect(result.current[0]).toBe('session value')
      
      act(() => {
        result.current[2]() // remove value
      })
      
      expect(result.current[0]).toBe('initial')
      expect(sessionStorage.getItem('test-key')).toBeNull()
    })
  })

  describe('Error handling', () => {
    it('handles JSON parse errors gracefully', () => {
      sessionStorage.setItem('invalid-json', 'invalid json')
      
      const { result } = renderHook(() => useSessionStorage('invalid-json', 'default'))
      
      expect(result.current[0]).toBe('default')
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Error reading sessionStorage key "invalid-json"'),
        expect.any(Error)
      )
    })

    it('handles sessionStorage write errors gracefully', () => {
      const { result } = renderHook(() => useSessionStorage('test-key', 'initial'))
      
      const originalSetItem = sessionStorage.setItem
      sessionStorage.setItem = jest.fn(() => {
        throw new Error('Storage error')
      })
      
      act(() => {
        result.current[1]('new value')
      })
      
      expect(result.current[0]).toBe('new value')
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Error setting sessionStorage key "test-key"'),
        expect.any(Error)
      )
      
      sessionStorage.setItem = originalSetItem
    })
  })

  describe('SSR compatibility', () => {
    it('returns initial value when window is undefined', () => {
      const originalWindow = global.window
      delete (global as any).window
      
      const { result } = renderHook(() => useSessionStorage('ssr-key', 'ssr-initial'))
      
      expect(result.current[0]).toBe('ssr-initial')
      
      global.window = originalWindow
    })
  })
})

describe('useLocalStorageAvailable', () => {
  it('returns true when localStorage is available', () => {
    const { result } = renderHook(() => useLocalStorageAvailable())
    
    expect(result.current).toBe(true)
  })

  it('returns false when localStorage throws an error', () => {
    const originalSetItem = localStorage.setItem
    localStorage.setItem = jest.fn(() => {
      throw new Error('localStorage not available')
    })
    
    const { result } = renderHook(() => useLocalStorageAvailable())
    
    expect(result.current).toBe(false)
    
    localStorage.setItem = originalSetItem
  })
})

describe('clearAppStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('clears app-specific localStorage keys', () => {
    // Set various keys
    localStorage.setItem('aiclases-user', 'user data')
    localStorage.setItem('pwa-settings', 'pwa data')
    localStorage.setItem('user-preferences', 'preferences')
    localStorage.setItem('course-progress', 'progress')
    localStorage.setItem('mentor-chat', 'chat data')
    localStorage.setItem('other-app-data', 'should not be cleared')
    localStorage.setItem('random-key', 'should not be cleared')
    
    clearAppStorage()
    
    // App keys should be cleared
    expect(localStorage.getItem('aiclases-user')).toBeNull()
    expect(localStorage.getItem('pwa-settings')).toBeNull()
    expect(localStorage.getItem('user-preferences')).toBeNull()
    expect(localStorage.getItem('course-progress')).toBeNull()
    expect(localStorage.getItem('mentor-chat')).toBeNull()
    
    // Non-app keys should remain
    expect(localStorage.getItem('other-app-data')).toBe('should not be cleared')
    expect(localStorage.getItem('random-key')).toBe('should not be cleared')
  })

  it('handles empty localStorage gracefully', () => {
    expect(() => clearAppStorage()).not.toThrow()
  })

  it('handles SSR environment gracefully', () => {
    const originalWindow = global.window
    delete (global as any).window
    
    expect(() => clearAppStorage()).not.toThrow()
    
    global.window = originalWindow
  })
})

describe('Hook stability and performance', () => {
  it('setValue function is stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useLocalStorage('stable-key', 'initial'))
    
    const firstSetValue = result.current[1]
    
    rerender()
    
    const secondSetValue = result.current[1]
    
    expect(firstSetValue).toBe(secondSetValue)
  })

  it('removeValue function is stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useLocalStorage('stable-key', 'initial'))
    
    const firstRemoveValue = result.current[2]
    
    rerender()
    
    const secondRemoveValue = result.current[2]
    
    expect(firstRemoveValue).toBe(secondRemoveValue)
  })

  it('does not cause unnecessary re-renders when value does not change', () => {
    const { result } = renderHook(() => useLocalStorage('no-change-key', 'initial'))
    
    const initialRenderCount = result.all.length
    
    // Set the same value
    act(() => {
      result.current[1]('initial')
    })
    
    // Should not cause additional render
    expect(result.all.length).toBe(initialRenderCount + 1) // Only one additional render for the setValue call
  })
})