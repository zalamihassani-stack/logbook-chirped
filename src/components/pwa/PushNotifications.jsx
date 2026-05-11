'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { savePushSubscription } from '@/app/actions/push'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export default function PushNotifications({ compact = false }) {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState('default')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const canPush =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)

    setSupported(canPush)
    if (canPush) {
      setPermission(Notification.permission)
    }
  }, [])

  async function handleEnable() {
    if (!supported || loading) return
    setLoading(true)
    setStatus('')

    try {
      const nextPermission = await Notification.requestPermission()
      setPermission(nextPermission)

      if (nextPermission !== 'granted') {
        setStatus('Notifications non autorisées.')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
        }))

      const result = await savePushSubscription(subscription.toJSON(), navigator.userAgent)
      if (result?.error) {
        setStatus(result.error)
        return
      }

      setStatus('Notifications activées.')
    } catch (error) {
      setStatus(error?.message || 'Activation impossible.')
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  const enabled = permission === 'granted'
  const Icon = enabled ? Bell : BellOff

  return (
    <div className={compact ? 'relative' : 'flex items-center gap-2'}>
      <button
        type="button"
        onClick={handleEnable}
        disabled={loading || enabled}
        title={enabled ? 'Notifications activées' : 'Activer les notifications'}
        className={compact
          ? 'flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 disabled:opacity-70'
          : 'flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-70'}
      >
        <Icon size={compact ? 17 : 15} strokeWidth={1.8} />
        {!compact && <span>{enabled ? 'Notifications actives' : loading ? 'Activation...' : 'Activer notifications'}</span>}
      </button>
      {!compact && status && <span className="text-xs text-slate-500">{status}</span>}
    </div>
  )
}
