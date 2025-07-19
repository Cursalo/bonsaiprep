'use client'

import { useState, useEffect, useCallback } from 'react'

export interface NetworkStatus {
  isOnline: boolean
  isOffline: boolean
  downlink?: number
  effectiveType?: string
  rtt?: number
  saveData?: boolean
  type?: string
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => {
    if (typeof window === 'undefined') {
      return { isOnline: true, isOffline: false }
    }

    return {
      isOnline: navigator.onLine,
      isOffline: !navigator.onLine,
    }
  })

  const updateNetworkStatus = useCallback(() => {
    if (typeof window === 'undefined') return

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    setNetworkStatus({
      isOnline: navigator.onLine,
      isOffline: !navigator.onLine,
      downlink: connection?.downlink,
      effectiveType: connection?.effectiveType,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
      type: connection?.type,
    })
  }, [])

  useEffect(() => {
    updateNetworkStatus()

    const handleOnline = () => updateNetworkStatus()
    const handleOffline = () => updateNetworkStatus()
    const handleConnectionChange = () => updateNetworkStatus()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for connection changes (if supported)
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [updateNetworkStatus])

  return networkStatus
}

// Hook for monitoring connection quality
export function useConnectionQuality() {
  const networkStatus = useNetworkStatus()
  
  const getConnectionQuality = useCallback(() => {
    if (!networkStatus.isOnline) return 'offline'
    
    const { effectiveType, downlink, rtt } = networkStatus
    
    // High quality connection
    if (effectiveType === '4g' && downlink && downlink > 10) {
      return 'excellent'
    }
    
    // Good connection
    if (effectiveType === '4g' || (downlink && downlink > 1.5)) {
      return 'good'
    }
    
    // Fair connection
    if (effectiveType === '3g' || (downlink && downlink > 0.5)) {
      return 'fair'
    }
    
    // Poor connection
    if (effectiveType === '2g' || (rtt && rtt > 2000)) {
      return 'poor'
    }
    
    return 'unknown'
  }, [networkStatus])

  return {
    ...networkStatus,
    quality: getConnectionQuality(),
    isSlowConnection: networkStatus.saveData || 
                     networkStatus.effectiveType === '2g' || 
                     networkStatus.effectiveType === 'slow-2g',
  }
}

// Hook for network-aware data fetching
export function useNetworkAwareFetch() {
  const { isOnline, quality, isSlowConnection } = useConnectionQuality()
  
  const shouldFetchHeavyResources = isOnline && quality !== 'poor' && !isSlowConnection
  const shouldPreloadData = isOnline && (quality === 'excellent' || quality === 'good')
  const shouldUseLowQualityAssets = isSlowConnection || quality === 'poor' || quality === 'fair'
  
  return {
    isOnline,
    shouldFetchHeavyResources,
    shouldPreloadData,
    shouldUseLowQualityAssets,
    connectionQuality: quality,
  }
}

// Hook for background sync simulation
export function useBackgroundSync() {
  const [pendingActions, setPendingActions] = useState<Array<{
    id: string
    action: string
    data: any
    timestamp: number
  }>>([])
  
  const { isOnline } = useNetworkStatus()

  const addPendingAction = useCallback((action: string, data: any) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setPendingActions(prev => [...prev, {
      id,
      action,
      data,
      timestamp: Date.now(),
    }])
    return id
  }, [])

  const removePendingAction = useCallback((id: string) => {
    setPendingActions(prev => prev.filter(action => action.id !== id))
  }, [])

  const clearPendingActions = useCallback(() => {
    setPendingActions([])
  }, [])

  // Process pending actions when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      console.log('Back online, processing pending actions:', pendingActions)
      // Here you would implement the actual sync logic
      // For now, we'll just clear them after a delay
      setTimeout(() => {
        clearPendingActions()
      }, 1000)
    }
  }, [isOnline, pendingActions, clearPendingActions])

  return {
    pendingActions,
    addPendingAction,
    removePendingAction,
    clearPendingActions,
    hasPendingActions: pendingActions.length > 0,
  }
}

// Hook for offline storage
export function useOfflineStorage<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Load data from IndexedDB/localStorage
    const loadData = async () => {
      try {
        if ('indexedDB' in window) {
          // Use IndexedDB for complex data
          // Implementation would go here
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem(`offline-${key}`)
          if (stored) {
            setData(JSON.parse(stored))
          }
        }
      } catch (error) {
        console.error('Error loading offline data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [key])

  const saveData = useCallback(async (newData: T) => {
    try {
      setData(newData)
      
      if ('indexedDB' in window) {
        // Save to IndexedDB
        // Implementation would go here
      } else {
        // Fallback to localStorage
        localStorage.setItem(`offline-${key}`, JSON.stringify(newData))
      }
    } catch (error) {
      console.error('Error saving offline data:', error)
    }
  }, [key])

  return {
    data,
    saveData,
    isLoading,
  }
}