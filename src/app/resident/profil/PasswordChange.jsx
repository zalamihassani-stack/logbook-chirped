'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KeyRound } from 'lucide-react'

export default function PasswordChange() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setStatus('error'); setMsg('Les mots de passe ne correspondent pas.'); return
    }
    if (password.length < 6) {
      setStatus('error'); setMsg('Minimum 6 caractères.'); return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setStatus('error'); setMsg(error.message) }
    else { setStatus('success'); setMsg('Mot de passe modifié.'); setPassword(''); setConfirm(''); setTimeout(() => setOpen(false), 1500) }
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <button
        onClick={() => { setOpen(!open); setStatus(null) }}
        className="flex items-center gap-2 text-sm font-medium w-full text-left"
        style={{ color: 'var(--color-navy)' }}
      >
        <KeyRound size={16} strokeWidth={1.75} />
        Changer le mot de passe
        <span className="ml-auto text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Nouveau mot de passe"
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400"
          />
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Confirmer le mot de passe"
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400"
          />
          {status && (
            <p className={`text-xs px-3 py-2 rounded-lg ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {msg}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-navy)' }}
          >
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      )}
    </div>
  )
}
