'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ROLE_HOME = { admin: '/admin', enseignant: '/enseignant', resident: '/resident' }

function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (msg.includes('Email not confirmed')) return 'Email non confirmé. Contactez un administrateur.'
  if (msg.includes('Too many requests')) return 'Trop de tentatives. Réessayez dans quelques minutes.'
  return 'Une erreur est survenue. Réessayez.'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      router.push(ROLE_HOME[profile?.role] ?? '/resident')
      router.refresh()
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0D2B4E' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="LCP" className="w-24 h-24 object-contain mb-4" />
          <h1 className="text-xl font-bold text-center text-white">
            Logbook Chirurgie Pédiatrique
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Connectez-vous à votre espace</p>
        </div>

        {/* Formulaire */}
        <div className="rounded-2xl shadow-xl p-8" style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/80">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="votre@email.com"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition text-white placeholder-white/30"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/80">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition text-white placeholder-white/30"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}
              />
            </div>
            {error && (
              <div className="text-sm text-red-300 bg-red-900/40 border border-red-500/40 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-sm transition active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: '#7BB8E8', color: '#0D2B4E' }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Application destinée au personnel aux services de chirurgie pédiatrique du CHU de Tanger
        </p>
      </div>
    </div>
  )
}
