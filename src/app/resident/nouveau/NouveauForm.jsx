'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { createRealisation } from '@/app/actions/resident'
import { createClient } from '@/lib/supabase/client'
import { ACTIVITY_TYPES, OBJECTIF_LEVEL_LABELS, getAutonomeSubmissionGuard } from '@/lib/logbook'
import { AlertTriangle, CheckCircle, Search, Target } from 'lucide-react'

const ACTIVITY_HELP = {
  expose: 'Observation ou exposition au geste.',
  supervise: 'RÃ©alisation avec encadrement direct.',
  autonome: 'RÃ©alisation autonome aprÃ¨s seuil de supervision.',
}
export default function NouveauForm({ procedures, enseignants, residents, residentYear }) {
  const router = useRouter()
  const [form, setForm] = useState({
    procedure_id: '',
    enseignant_id: '',
    superviseur_resident_id: '',
    performed_at: new Date().toISOString().slice(0, 10),
    activity_type: '',
    ipp_patient: '',
    compte_rendu: '',
    commentaire: '',
  })
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [autonomyWarning, setAutonomyWarning] = useState('')

  const selectedProc = procedures.find((procedure) => procedure.id === form.procedure_id)
  const isHorsObjectifs = selectedProc && !selectedProc.isObjectif

  const filteredProcedures = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return procedures

    return procedures.filter((procedure) => {
      const haystack = [procedure.name, procedure.pathologie, procedure.categories?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [procedures, query])

  const groupedProcedures = useMemo(() => {
    const groups = new Map()
    for (const procedure of filteredProcedures) {
      const categoryName = procedure.categories?.name ?? 'Sans catÃ©gorie'
      if (!groups.has(categoryName)) groups.set(categoryName, [])
      groups.get(categoryName).push(procedure)
    }
    return Array.from(groups.entries())
  }, [filteredProcedures])

  useEffect(() => {
    let ignore = false

    async function checkAutonomyPrerequisite() {
      setAutonomyWarning('')
      if (form.activity_type !== 'autonome' || !form.procedure_id) return

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      try {
        const guard = await getAutonomeSubmissionGuard(supabase, user.id, form.procedure_id)
        if (!ignore && !guard.allowed) {
          setAutonomyWarning(
            guard.missingSuperviseCount > 0
              ? `PrÃ©-requis autonomie non atteint : il manque ${guard.missingSuperviseCount} acte(s) supervisÃ©(s) pour ce geste. La soumission reste possible.`
              : 'PrÃ©-requis autonomie non atteint pour ce geste. La soumission reste possible.'
          )
        }
      } catch {
        if (!ignore) setAutonomyWarning('')
      }
    }

    checkAutonomyPrerequisite()
    return () => { ignore = true }
  }, [form.activity_type, form.procedure_id])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.procedure_id) {
      setError('SÃ©lectionnez un geste.')
      return
    }

    if (!form.activity_type) {
      setError("SÃ©lectionnez un type d'activitÃ©.")
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const res = await createRealisation(form)

    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }

    setSuccess('Geste envoyé pour validation. L’enseignant concerné est notifié.')
    setTimeout(() => router.push('/resident/historique'), 900)
  }

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function selectProcedure(procedureId) {
    setField('procedure_id', procedureId)
    setError('')
  }

  return (
    <>
      <PageHeader title="Nouvelle rÃ©alisation" subtitle="Choisir le geste, prÃ©ciser le contexte, puis envoyer en validation" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#0D2B4E' }}>Geste chirurgical</h2>
              <p className="mt-0.5 text-xs text-slate-500">Recherche par nom, pathologie ou catÃ©gorie</p>
            </div>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
              AnnÃ©e {residentYear}
            </span>
          </div>

          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un geste..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-sky-400"
            />
          </label>

          <div className="mt-3 max-h-72 space-y-3 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
            {groupedProcedures.map(([categoryName, items]) => (
              <div key={categoryName}>
                <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{categoryName}</p>
                <div className="space-y-1">
                  {items.map((procedure) => {
                    const selected = procedure.id === form.procedure_id
                    return (
                      <button
                        key={procedure.id}
                        type="button"
                        onClick={() => selectProcedure(procedure.id)}
                        className="flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2 text-left transition"
                        style={selected ? { borderColor: '#0D2B4E', backgroundColor: '#E8F4FC' } : { borderColor: 'transparent', backgroundColor: 'white' }}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-slate-800">{procedure.name}</span>
                          {procedure.pathologie && <span className="mt-0.5 block text-xs text-slate-500">{procedure.pathologie}</span>}
                        </span>
                        <span
                          className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={procedure.isObjectif ? { backgroundColor: '#dcfce7', color: '#166534' } : { backgroundColor: '#ffedd5', color: '#9a3412' }}
                        >
                          {procedure.isObjectif ? 'Objectif' : 'Hors objectif'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {filteredProcedures.length === 0 && (
              <p className="py-5 text-center text-sm text-slate-400">Aucun geste trouvÃ©</p>
            )}
          </div>

          {selectedProc && (
            <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-sky-700">
                  <Target size={18} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{selectedProc.name}</p>
                  <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    <InfoLine label="CatÃ©gorie" value={selectedProc.categories?.name ?? '-'} />
                    <InfoLine label="Statut" value={selectedProc.isObjectif ? `Objectif A${residentYear}` : 'Hors objectifs annuels'} />
                    <InfoLine label="Niveau attendu" value={OBJECTIF_LEVEL_LABELS[selectedProc.objective?.required_level] ?? '-'} />
                    <InfoLine label="Minimum requis" value={selectedProc.objective?.min_count ? `${selectedProc.objective.min_count} acte(s)` : '-'} />
                    <InfoLine label="Min. exposition" value={`${selectedProc.seuil_exposition_min ?? 0} acte(s)`} />
                    <InfoLine label="Min. supervision" value={`${selectedProc.seuil_supervision_min ?? 0} acte(s)`} />
                    <InfoLine label="Min. autonomie" value={`${selectedProc.seuil_autonomie_min ?? 0} acte(s)`} />
                    <InfoLine label="Pré-requis autonomie" value={selectedProc.seuil_deblocage_autonomie ? `${selectedProc.seuil_deblocage_autonomie} acte(s) supervisé(s)` : '-'} />
                    <InfoLine label="Objectif final" value={OBJECTIF_LEVEL_LABELS[selectedProc.objectif_final] ?? '-'} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isHorsObjectifs && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-700">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              Ce geste est hors de vos objectifs pour l&apos;annÃ©e {residentYear}. Il sera tout de mÃªme envoyÃ© comme hors objectifs.
            </div>
          )}
          {autonomyWarning && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              {autonomyWarning}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-4 text-sm font-semibold" style={{ color: '#0D2B4E' }}>Contexte de rÃ©alisation</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="IPP patient">
              <input
                type="text"
                value={form.ipp_patient}
                onChange={(event) => setField('ipp_patient', event.target.value)}
                placeholder="Identifiant patient"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
              />
            </Field>
            <Field label="Date de rÃ©alisation *">
              <input
                type="date"
                value={form.performed_at}
                onChange={(event) => setField('performed_at', event.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
              />
            </Field>
          </div>

          <div className="mt-4">
            <p className="mb-2 block text-sm font-medium" style={{ color: '#0D2B4E' }}>
              Type d&apos;activitÃ© *
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {ACTIVITY_TYPES.map((activityType) => {
                const selected = form.activity_type === activityType.value
                return (
                  <button
                    key={activityType.value}
                    type="button"
                    onClick={() => setField('activity_type', activityType.value)}
                    className="rounded-xl border-2 px-3 py-3 text-left transition"
                    style={selected ? { borderColor: '#0D2B4E', backgroundColor: '#0D2B4E', color: 'white' } : { borderColor: '#e2e8f0', color: '#374151', backgroundColor: 'white' }}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {selected && <CheckCircle size={15} strokeWidth={2} />}
                      {activityType.label}
                    </span>
                    <span className="mt-1 block text-xs" style={{ color: selected ? 'rgba(255,255,255,0.75)' : '#64748b' }}>
                      {ACTIVITY_HELP[activityType.value]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-4 text-sm font-semibold" style={{ color: '#0D2B4E' }}>Encadrement</h2>
          <div className="space-y-4">
            <Field label="Enseignant superviseur *">
              <select
                value={form.enseignant_id}
                onChange={(event) => setField('enseignant_id', event.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
              >
                <option value="">Choisir un enseignant...</option>
                {enseignants.map((enseignant) => (
                  <option key={enseignant.id} value={enseignant.id}>{enseignant.full_name}</option>
                ))}
              </select>
            </Field>

            <Field label="RÃ©sident superviseur (optionnel)">
              <select
                value={form.superviseur_resident_id}
                onChange={(event) => setField('superviseur_resident_id', event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
              >
                <option value="">Aucun</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>{resident.full_name}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-4 text-sm font-semibold" style={{ color: '#0D2B4E' }}>Notes</h2>
          <div className="space-y-4">
            <Field label="Compte rendu opÃ©ratoire">
              <textarea
                value={form.compte_rendu}
                onChange={(event) => setField('compte_rendu', event.target.value)}
                rows={4}
                placeholder="Description de l'acte rÃ©alisÃ©..."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
              />
            </Field>
            <Field label="Commentaire">
              <textarea
                value={form.commentaire}
                onChange={(event) => setField('commentaire', event.target.value)}
                rows={2}
                placeholder="Remarque personnelle..."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
              />
            </Field>
          </div>
        </section>

        {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
        {success && <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">{success}</p>}

        <div className="sticky bottom-20 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: '#0D2B4E' }}
          >
            {loading ? 'Envoi en cours...' : 'Soumettre pour validation'}
          </button>
        </div>
      </form>
    </>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>{label}</span>
      {children}
    </label>
  )
}

function InfoLine({ label, value }) {
  return (
    <div>
      <p className="font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-slate-800">{value}</p>
    </div>
  )
}
