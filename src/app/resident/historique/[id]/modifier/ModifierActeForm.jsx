'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { resubmitRealisation } from '@/app/actions/resident'
import { ACTIVITY_TYPES } from '@/lib/logbook'

export default function ModifierActeForm({ realisationId, current, enseignants, residents }) {
  const router = useRouter()
  const isPending = current.status === 'pending'
  const today = new Date().toISOString().slice(0, 10)
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
    setForm((f) => ({ ...f, [key]: value }))
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
    router.push(`/resident/historique/${realisationId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-28 md:pb-0">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Date</label>
          <input
            type="date"
            value={form.performed_at}
            onChange={(e) => set('performed_at', e.target.value)}
            max={today}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Type d&apos;activité</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {ACTIVITY_TYPES.map((activityType, index) => (
              <button
                key={activityType.value}
                type="button"
                onClick={() => set('activity_type', activityType.value)}
                className="rounded-xl border-2 px-3 py-2 text-sm font-medium transition"
                style={form.activity_type === activityType.value
                  ? { borderColor: 'var(--color-navy)', backgroundColor: 'var(--color-navy)', color: 'white' }
                  : { borderColor: '#e2e8f0', color: '#374151' }}
              >
                {index + 1}. {activityType.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>IPP patient *</label>
          <input
            type="text"
            value={form.ipp_patient}
            onChange={(e) => set('ipp_patient', e.target.value)}
            placeholder="Identifiant patient"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Enseignant</label>
          <select
            value={form.enseignant_id}
            onChange={(e) => set('enseignant_id', e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          >
            {enseignants.map((enseignant) => (
              <option key={enseignant.id} value={enseignant.id}>{enseignant.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Résident superviseur</label>
          <select
            value={form.superviseur_resident_id}
            onChange={(e) => set('superviseur_resident_id', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="">Aucun</option>
            {residents.map((resident) => (
              <option key={resident.id} value={resident.id}>{resident.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Compte rendu</label>
          <textarea
            value={form.compte_rendu}
            onChange={(e) => set('compte_rendu', e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Commentaire</label>
          <textarea
            value={form.commentaire}
            onChange={(e) => set('commentaire', e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-20 flex gap-3 border-t border-slate-100 bg-white px-5 py-3 md:static md:border-0 md:bg-transparent md:p-0">
        <Link
          href={`/resident/historique/${realisationId}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600"
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
          Retour
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-navy)' }}
        >
          {loading ? 'Envoi...' : isPending ? 'Enregistrer' : 'Re-soumettre'}
        </button>
      </div>
    </form>
  )
}
