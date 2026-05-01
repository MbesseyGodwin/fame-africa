// apps/mobile/src/hooks/useNetworkStatus.ts

import { useState, useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'

export type ConnectionStatus = 'excellent' | 'good' | 'poor' | 'offline'

export function useNetworkStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('good')
  const [latency, setLatency] = useState<number>(0)
  const [isOffline, setIsOffline] = useState(false)

  const checkConnection = async () => {
    const start = Date.now()
    try {
      // Use a lightweight endpoint to check latency
      // You can replace this with your actual API health check
      const response = await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-store' 
      })
      
      const end = Date.now()
      const rtt = end - start
      setLatency(rtt)
      setIsOffline(false)

      if (rtt < 150) setStatus('excellent')
      else if (rtt < 500) setStatus('good')
      else setStatus('poor')
      
    } catch (error) {
      setIsOffline(true)
      setStatus('offline')
    }
  }

  useEffect(() => {
    // Initial check
    checkConnection()

    // Periodic check every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    // Check on app resume
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkConnection()
      }
    })

    return () => {
      clearInterval(interval)
      subscription.remove()
    }
  }, [])

  return { status, latency, isOffline, checkConnection }
}
