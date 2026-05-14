'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateRealisation, refuseRealisation } from '@/app/actions/enseignant'

export default function ValidationForm({ realisationId }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  async function handle(action) {
    if (action === 'refuse' && feedback.trim().length < 8) {
      setError('Un refus doit inclure un feedback pédagogique exploitable.')
      return
    }

    setLoading(action)
    setError('')

    const res = action === 'validate'
      ? await validateRealisation(realisationId, feedback)
      : await refuseRealisation(realisationId, feedback)
    setLoading(null)
    if (res.error) {
      setError(res.error)
      return
    }
    router.push('/enseignant/demandes')
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Feedback pédagogique</h3>
      <p className="mb-3 text-xs leading-relaxed text-slate-500">
        Obligatoire en cas de refus. Indiquez ce qui manque, ce qui doit être corrigé et le niveau attendu.
      </p>
      <textarea
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        placeholder="Ex : compte rendu incomplet, niveau d’autonomie à reclasser, supervision à préciser..."
        rows={4}
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
      />
      <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 -mx-5 -mb-5 mt-5 rounded-b-2xl">
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={() => handle('refuse')}
            disabled={!!loading}
            className="flex-1 rounded-xl border-2 border-red-500 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            {loading === 'refuse' ? 'Refus...' : 'Refuser'}
          </button>
          <button
            onClick={() => handle('validate')}
            disabled={!!loading}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-navy)' }}
          >
            {loading === 'validate' ? 'Validation...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}
