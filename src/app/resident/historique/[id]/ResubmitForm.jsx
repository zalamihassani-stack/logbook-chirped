'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resubmitRealisation } from '@/app/actions/resident'
import { ACTIVITY_TYPES } from '@/lib/logbook'

export default function ResubmitForm({ realisationId, current, enseignants, residents }) {
  const router = useRouter()
  const isPending = current.status === 'pending'
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    procedure_id: current.procedure_id,
    enseignant_id: current.enseignant_id,
    superviseur_resident_id: current.superviseur_resident_id ?? '',
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
        className="w-full rounded-xl border-2 py-2.5 text-sm font-medium transition hover:bg-slate-50"
        style={{ borderColor: '#0D2B4E', color: '#0D2B4E' }}
      >
        {isPending ? 'Modifier le geste en attente' : 'Modifier et re-soumettre'}
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="mb-4 text-sm font-semibold" style={{ color: '#0D2B4E' }}>
        {isPending ? 'Modifier le geste en attente' : 'Modifier et re-soumettre'}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Date</label>
          <input
            type="date"
            value={form.performed_at}
            onChange={(event) => set('performed_at', event.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Type d&apos;activité</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {ACTIVITY_TYPES.map((activityType, index) => (
              <button
                key={activityType.value}
                type="button"
                onClick={() => set('activity_type', activityType.value)}
                className="rounded-xl border-2 px-3 py-2 text-sm font-medium transition"
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
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Enseignant</label>
          <select
            value={form.enseignant_id}
            onChange={(event) => set('enseignant_id', event.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          >
            {enseignants.map((enseignant) => <option key={enseignant.id} value={enseignant.id}>{enseignant.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Résident superviseur</label>
          <select
            value={form.superviseur_resident_id}
            onChange={(event) => set('superviseur_resident_id', event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="">Aucun</option>
            {residents.map((resident) => <option key={resident.id} value={resident.id}>{resident.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Compte rendu</label>
          <textarea
            value={form.compte_rendu}
            onChange={(event) => set('compte_rendu', event.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Commentaire</label>
          <textarea
            value={form.commentaire}
            onChange={(event) => set('commentaire', event.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm">Annuler</button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: '#0D2B4E' }}
          >
            {loading ? 'Envoi...' : isPending ? 'Enregistrer' : 'Re-soumettre'}
          </button>
        </div>
      </form>
    </div>
  )
}
