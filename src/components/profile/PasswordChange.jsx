'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KeyRound } from 'lucide-react'

export default function PasswordChange() {
  const [open, setOpen] = useState(false)
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
    if (password.length < 6) {
      setStatus('error')
      setMsg('Minimum 6 caracteres.')
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
    setMsg('Mot de passe modifie.')
    setPassword('')
    setConfirm('')
    setTimeout(() => setOpen(false), 1500)
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <button
        onClick={() => { setOpen(!open); setStatus(null) }}
        className="flex w-full items-center gap-2 text-left text-sm font-medium"
        style={{ color: '#0D2B4E' }}
      >
        <KeyRound size={16} strokeWidth={1.75} />
        Changer le mot de passe
        <span className="ml-auto text-xs text-slate-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
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
            style={{ backgroundColor: '#0D2B4E' }}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      )}
    </div>
  )
}
