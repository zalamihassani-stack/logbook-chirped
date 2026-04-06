'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resubmitRealisation } from '@/app/actions/resident'

const LEVELS = [
  { value: 1, label: 'Observation' },
  { value: 2, label: 'Aide opératoire' },
  { value: 3, label: 'Sous supervision' },
  { value: 4, label: 'Autonome' },
]

export default function ResubmitForm({ realisationId, current, procedures, enseignants }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    procedure_id: current.procedure_id,
    enseignant_id: current.enseignant_id,
    performed_at: current.performed_at?.slice(0, 10),
    participation_level: current.participation_level,
    ipp_patient: current.ipp_patient ?? '',
    compte_rendu: current.compte_rendu ?? '',
    commentaire: current.commentaire ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const res = await resubmitRealisation(realisationId, form)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    router.push('/resident/historique')
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-xl border-2 text-sm font-medium transition hover:bg-slate-50"
        style={{ borderColor: '#0D2B4E', color: '#0D2B4E' }}>
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
          <select value={form.procedure_id} onChange={e => set('procedure_id', e.target.value)} required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
            {procedures.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Date</label>
          <input type="date" value={form.performed_at} onChange={e => set('performed_at', e.target.value)} required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#0D2B4E' }}>Niveau</label>
          <div className="grid grid-cols-2 gap-2">
            {LEVELS.map(l => (
              <button key={l.value} type="button" onClick={() => set('participation_level', l.value)}
                className="py-2 px-3 rounded-xl border-2 text-sm font-medium transition"
                style={form.participation_level === l.value
                  ? { borderColor: '#0D2B4E', backgroundColor: '#0D2B4E', color: 'white' }
                  : { borderColor: '#e2e8f0', color: '#374151' }}>
                {l.value}. {l.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Enseignant</label>
          <select value={form.enseignant_id} onChange={e => set('enseignant_id', e.target.value)} required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
            {enseignants.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Compte rendu</label>
          <textarea value={form.compte_rendu} onChange={e => set('compte_rendu', e.target.value)} rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none" />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm">Annuler</button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: '#0D2B4E' }}>
            {loading ? 'Envoi…' : 'Re-soumettre'}
          </button>
        </div>
      </form>
    </div>
  )
}
