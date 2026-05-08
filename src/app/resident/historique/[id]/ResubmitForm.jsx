'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resubmitRealisation } from '@/app/actions/resident'
import { ACTIVITY_TYPES } from '@/lib/logbook'

export default function ResubmitForm({ realisationId, current, procedures, enseignants }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    procedure_id: current.procedure_id,
    enseignant_id: current.enseignant_id,
    performed_at: current.performed_at?.slice(0, 10),
    activity_type: current.activity_type,
    ipp_patient: current.ipp_patient ?? '',
    compte_rendu: current.compte_rendu ?? '',
    commentaire: current.commentaire ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(key, value) {
    setForm((currentForm) => ({ ...currentForm, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    setLoading(true)
    const res = await resubmitRealisation(realisationId, form)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    router.push('/resident/historique')
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-xl border-2 text-sm font-medium transition hover:bg-slate-50"
        style={{ borderColor: '#0D2B4E', color: '#0D2B4E' }}
      >
        Modifier et re-soumettre
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <p className="font-semibold text-sm mb-4" style={{ color: '#0D2B4E' }}>Modifier et re-soumettre</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Geste</label>
          <select
            value={form.procedure_id}
            onChange={(event) => set('procedure_id', event.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
          >
            {procedures.map((procedure) => <option key={procedure.id} value={procedure.id}>{procedure.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Date</label>
          <input
            type="date"
            value={form.performed_at}
            onChange={(event) => set('performed_at', event.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#0D2B4E' }}>Type d&apos;activite</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {ACTIVITY_TYPES.map((activityType, index) => (
              <button
                key={activityType.value}
                type="button"
                onClick={() => set('activity_type', activityType.value)}
                className="py-2 px-3 rounded-xl border-2 text-sm font-medium transition"
                style={form.activity_type === activityType.value
                  ? { borderColor: '#0D2B4E', backgroundColor: '#0D2B4E', color: 'white' }
                  : { borderColor: '#e2e8f0', color: '#374151' }}
              >
                {index + 1}. {activityType.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Enseignant</label>
          <select
            value={form.enseignant_id}
            onChange={(event) => set('enseignant_id', event.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
          >
            {enseignants.map((enseignant) => <option key={enseignant.id} value={enseignant.id}>{enseignant.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Compte rendu</label>
          <textarea
            value={form.compte_rendu}
            onChange={(event) => set('compte_rendu', event.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none"
          />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm">Annuler</button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: '#0D2B4E' }}
          >
            {loading ? 'Envoi...' : 'Re-soumettre'}
          </button>
        </div>
      </form>
    </div>
  )
}
