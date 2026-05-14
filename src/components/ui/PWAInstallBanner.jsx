'use client'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('pwa-banner-dismissed') === '1'
  )

  useEffect(() => {
    if (dismissed) {
      return
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setPrompt(event)
    }
    const handleInstalled = () => setPrompt(null)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [dismissed])

  async function handleInstall() {
    if (!prompt) return

    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setPrompt(null)
    }
  }

  function handleDismiss() {
    sessionStorage.setItem('pwa-banner-dismissed', '1')
    setDismissed(true)
  }

  if (!prompt || dismissed) return null

  return (
    <div
      className="fixed left-0 right-0 top-12 z-30 flex items-center gap-3 px-4 py-2.5 shadow-md md:hidden"
      style={{ backgroundColor: '#1a3a5c', borderBottom: '1px solid rgba(123,184,232,0.3)' }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-tight text-white">Installer l&apos;application</p>
        <p className="text-[11px] leading-tight" style={{ color: 'var(--color-sky)' }}>
          Accès rapide depuis votre écran d&apos;accueil
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
        style={{ backgroundColor: 'var(--color-sky)', color: 'var(--color-navy)' }}
      >
        <Download size={13} strokeWidth={2.5} />
        Installer
      </button>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 rounded-lg p-1"
        style={{ color: 'rgba(255,255,255,0.5)' }}
        aria-label="Fermer"
      >
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  )
}
