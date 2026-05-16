'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function PasswordChange() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState(null)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (password !== confirm) {
      setStatus('error')
      setMsg('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setStatus('error')
      setMsg('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (!/[A-Z]/.test(password)) {
      setStatus('error')
      setMsg('Le mot de passe doit contenir au moins une majuscule.')
      return
    }
    if (!/[0-9]/.test(password)) {
      setStatus('error')
      setMsg('Le mot de passe doit contenir au moins un chiffre.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setStatus('error')
      setMsg(error.message)
      return
    }

    setStatus('success')
    setMsg('Mot de passe modifié.')
    setPassword('')
    setConfirm('')
  }

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-slate-500">
        Changer le mot de passe
        <ChevronDown size={14} className="transition-transform duration-200 group-open:rotate-180 text-slate-400" />
      </summary>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Nouveau mot de passe"
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
        <input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="Confirmer le mot de passe"
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
        {status && (
          <p className={`rounded-lg px-3 py-2 text-xs ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-navy)' }}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </details>
  )
}
