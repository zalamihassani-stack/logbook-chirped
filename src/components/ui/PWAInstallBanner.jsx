'use client'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('pwa-banner-dismissed')) {
      setDismissed(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setPrompt(null))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setPrompt(null)
  }

  function handleDismiss() {
    sessionStorage.setItem('pwa-banner-dismissed', '1')
    setDismissed(true)
  }

  if (!prompt || dismissed) return null

  return (
    <div
      className="fixed top-12 left-0 right-0 z-30 flex md:hidden items-center gap-3 px-4 py-2.5 shadow-md"
      style={{ backgroundColor: '#1a3a5c', borderBottom: '1px solid rgba(123,184,232,0.3)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold leading-tight">Installer l'application</p>
        <p className="text-[11px] leading-tight" style={{ color: '#7BB8E8' }}>
          Accès rapide depuis votre écran d'accueil
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
        style={{ backgroundColor: '#7BB8E8', color: '#0D2B4E' }}
      >
        <Download size={13} strokeWidth={2.5} />
        Installer
      </button>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-lg"
        style={{ color: 'rgba(255,255,255,0.5)' }}
        aria-label="Fermer"
      >
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  )
}
