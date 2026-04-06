'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { createRealisation } from '@/app/actions/resident'
import { AlertTriangle } from 'lucide-react'

const LEVELS = [
  { value: 1, label: 'Observation' },
  { value: 2, label: 'Aide opératoire' },
  { value: 3, label: 'Sous supervision' },
  { value: 4, label: 'Autonome' },
]

export default function NouveauForm({ procedures, enseignants, residents, residentYear }) {
  const router = useRouter()
  const [form, setForm] = useState({
    procedure_id: '',
    enseignant_id: '',
    superviseur_resident_id: '',
    performed_at: new Date().toISOString().slice(0, 10),
    participation_level: '',
    ipp_patient: '',
    compte_rendu: '',
    commentaire: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedProc = procedures.find(p => p.id === form.procedure_id)
  const isHorsObjectifs = selectedProc && !selectedProc.isObjectif

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.participation_level) { setError('Sélectionnez un niveau de participation.'); return }
    setLoading(true); setError('')
    const res = await createRealisation(form)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    router.push('/resident/historique')
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  return (
    <>
      <PageHeader title="Nouvelle réalisation" subtitle="Enregistrer un acte chirurgical" />
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Geste */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Geste chirurgical *</label>
          <select value={form.procedure_id} onChange={e => set('procedure_id', e.target.value)} required
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none bg-white focus:border-sky-400 transition">
            <option value="">Sélectionner un geste…</option>
            {procedures.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.isObjectif ? `(Objectif A${residentYear})` : '(Hors objectifs)'}
              </option>
            ))}
          </select>
          {isHorsObjectifs && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2.5 text-sm text-orange-700">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              Ce geste est hors de vos objectifs pour l'Année {residentYear}.
            </div>
          )}
        </div>

        {/* IPP + Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>IPP patient</label>
            <input type="text" value={form.ipp_patient} onChange={e => set('ipp_patient', e.target.value)}
              placeholder="Identifiant patient"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Date de réalisation *</label>
            <input type="date" value={form.performed_at} onChange={e => set('performed_at', e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400 transition" />
          </div>
        </div>

        {/* Niveau de participation */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#0D2B4E' }}>Niveau de participation *</label>
          <div className="grid grid-cols-2 gap-2">
            {LEVELS.map(l => (
              <button key={l.value} type="button" onClick={() => set('participation_level', l.value)}
                className="py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition"
                style={form.participation_level === l.value
                  ? { borderColor: '#0D2B4E', backgroundColor: '#0D2B4E', color: 'white' }
                  : { borderColor: '#e2e8f0', color: '#374151' }}>
                {l.value}. {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Enseignant superviseur */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Enseignant superviseur *</label>
          <select value={form.enseignant_id} onChange={e => set('enseignant_id', e.target.value)} required
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none bg-white focus:border-sky-400 transition">
            <option value="">Choisir un enseignant…</option>
            {enseignants.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </div>

        {/* Résident superviseur */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Résident superviseur (optionnel)</label>
          <select value={form.superviseur_resident_id} onChange={e => set('superviseur_resident_id', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none bg-white focus:border-sky-400 transition">
            <option value="">Aucun</option>
            {residents.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
          </select>
        </div>

        {/* Compte rendu */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Compte rendu opératoire</label>
          <textarea value={form.compte_rendu} onChange={e => set('compte_rendu', e.target.value)}
            rows={4} placeholder="Description de l'acte réalisé…"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400 transition resize-none" />
        </div>

        {/* Commentaire */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Commentaire</label>
          <textarea value={form.commentaire} onChange={e => set('commentaire', e.target.value)}
            rows={2} placeholder="Remarque personnelle…"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400 transition resize-none" />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition active:scale-95"
          style={{ backgroundColor: '#0D2B4E' }}>
          {loading ? 'Envoi en cours…' : 'Soumettre pour validation'}
        </button>
      </form>
    </>
  )
}
