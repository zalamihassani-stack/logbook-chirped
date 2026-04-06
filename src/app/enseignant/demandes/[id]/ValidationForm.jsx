'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateRealisation, refuseRealisation } from '@/app/actions/enseignant'

export default function ValidationForm({ realisationId }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')

  async function handle(action) {
    setLoading(action); setError('')
    const res = action === 'validate'
      ? await validateRealisation(realisationId, feedback)
      : await refuseRealisation(realisationId, feedback)
    setLoading('')
    if (res.error) { setError(res.error); return }
    router.push('/enseignant/demandes')
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h3 className="font-semibold text-sm mb-3" style={{ color: '#0D2B4E' }}>Feedback pédagogique</h3>
      <textarea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="Commentaire pour le résident (optionnel)…"
        rows={4}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400 transition resize-none"
      />
      {error && <p className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-3 mt-4">
        <button onClick={() => handle('refuse')} disabled={!!loading}
          className="flex-1 py-2.5 rounded-xl border-2 border-red-500 text-red-600 text-sm font-medium disabled:opacity-60 transition hover:bg-red-50">
          {loading === 'refuse' ? 'Refus…' : 'Refuser'}
        </button>
        <button onClick={() => handle('validate')} disabled={!!loading}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
          style={{ backgroundColor: '#0D2B4E' }}>
          {loading === 'validate' ? 'Validation…' : 'Valider'}
        </button>
      </div>
    </div>
  )
}
