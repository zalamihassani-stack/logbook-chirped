'use client'

import { useEffect } from 'react'

export default function SWRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') {
      return
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch (error) {
        console.error('Service worker registration failed:', error)
      }
    }

    registerServiceWorker()
  }, [])

  return null
}
