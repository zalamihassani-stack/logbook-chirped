'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { createRealisation } from '@/app/actions/resident'
import { AlertTriangle } from 'lucide-react'

const LEVELS = [
  { value: 1, label: 'Observation' },
  { value: 2, label: 'Aide operatoire' },
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

  const selectedProc = procedures.find((procedure) => procedure.id === form.procedure_id)
  const isHorsObjectifs = selectedProc && !selectedProc.isObjectif

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.participation_level) {
      setError('Selectionnez un niveau de participation.')
      return
    }

    setLoading(true)
    setError('')

    const res = await createRealisation(form)

    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }

    router.push('/resident/historique')
  }

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <>
      <PageHeader title="Nouvelle realisation" subtitle="Enregistrer un acte chirurgical" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>
            Geste chirurgical *
          </label>
          <select
            value={form.procedure_id}
            onChange={(event) => setField('procedure_id', event.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
          >
            <option value="">Selectionner un geste...</option>
            {procedures.map((procedure) => (
              <option key={procedure.id} value={procedure.id}>
                {procedure.name} {procedure.isObjectif ? `(Objectif A${residentYear})` : '(Hors objectifs)'}
              </option>
            ))}
          </select>
          {isHorsObjectifs && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-700">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              Ce geste est hors de vos objectifs pour l&apos;annee {residentYear}.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>
              IPP patient
            </label>
            <input
              type="text"
              value={form.ipp_patient}
              onChange={(event) => setField('ipp_patient', event.target.value)}
              placeholder="Identifiant patient"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>
              Date de realisation *
            </label>
            <input
              type="date"
              value={form.performed_at}
              onChange={(event) => setField('performed_at', event.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: '#0D2B4E' }}>
            Niveau de participation *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setField('participation_level', level.value)}
                className="rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition"
                style={
                  form.participation_level === level.value
                    ? { borderColor: '#0D2B4E', backgroundColor: '#0D2B4E', color: 'white' }
                    : { borderColor: '#e2e8f0', color: '#374151' }
                }
              >
                {level.value}. {level.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>
            Enseignant superviseur *
          </label>
          <select
            value={form.enseignant_id}
            onChange={(event) => setField('enseignant_id', event.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
          >
            <option value="">Choisir un enseignant...</option>
            {enseignants.map((enseignant) => (
              <option key={enseignant.id} value={enseignant.id}>
                {enseignant.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>
            Resident superviseur (optionnel)
          </label>
          <select
            value={form.superviseur_resident_id}
            onChange={(event) => setField('superviseur_resident_id', event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
          >
            <option value="">Aucun</option>
            {residents.map((resident) => (
              <option key={resident.id} value={resident.id}>
                {resident.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>
            Compte rendu operatoire
          </label>
          <textarea
            value={form.compte_rendu}
            onChange={(event) => setField('compte_rendu', event.target.value)}
            rows={4}
            placeholder="Description de l'acte realise..."
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>
            Commentaire
          </label>
          <textarea
            value={form.commentaire}
            onChange={(event) => setField('commentaire', event.target.value)}
            rows={2}
            placeholder="Remarque personnelle..."
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: '#0D2B4E' }}
        >
          {loading ? 'Envoi en cours...' : 'Soumettre pour validation'}
        </button>
      </form>
    </>
  )
}
