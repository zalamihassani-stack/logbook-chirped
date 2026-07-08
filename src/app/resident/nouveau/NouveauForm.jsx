'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import { createRealisation } from '@/app/actions/resident'
import { ACTIVITY_TYPES, DEFAULT_SERVICE, OBJECTIF_LEVEL_LABELS, SERVICE_LABELS, getCountForRequiredLevel, normalizeService } from '@/lib/logbook'
import { AlertTriangle, ArrowLeft, CheckCircle, ChevronDown, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useServerAction } from '@/hooks/useServerAction'
import { validateRealisation } from '@/lib/schemas/realisation'

export default function NouveauForm({ procedures, enseignants, residents, residentYear, progressByProcedure = {}, settings = {}, initialProcedureId = '' }) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    procedure_id: procedures.some((procedure) => procedure.id === initialProcedureId) ? initialProcedureId : '',
    enseignant_id: '',
    superviseur_resident_id: '',
    performed_at: today,
    activity_type: '',
    ipp_patient: '',
    compte_rendu: '',
    commentaire: '',
  })
  const [query, setQuery] = useState('')
  const { execute, loading, error, setError } = useServerAction()
  const allowHorsObjectifs = settings.allow_hors_objectifs !== false
  const compteRenduRequired = Boolean(settings.compte_rendu_required)

  const selectedProc = procedures.find((procedure) => procedure.id === form.procedure_id)
  const selectedService = normalizeService(selectedProc?.service)
  const filteredEnseignants = useMemo(
    () => selectedProc
      ? enseignants.filter((enseignant) => normalizeService(enseignant.service) === selectedService)
      : enseignants,
    [selectedProc, selectedService, enseignants],
  )
  const isHorsObjectifs = selectedProc && !selectedProc.isObjectif
  const selectedProgress = selectedProc?.objective
    ? getCountForRequiredLevel(progressByProcedure[selectedProc.id], selectedProc.objective.required_level)
    : 0
  const selectedMissing = selectedProc?.objective
    ? Math.max(0, selectedProc.objective.min_count - selectedProgress)
    : 0
  const completionSteps = [
    { label: 'Geste', done: Boolean(form.procedure_id) },
    { label: 'Niveau', done: Boolean(form.activity_type) },
    { label: 'Encadrant', done: Boolean(form.enseignant_id) },
    { label: 'IPP', done: Boolean(form.ipp_patient.trim()) },
  ]

  const filteredProcedures = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const availableProcedures = allowHorsObjectifs
      ? procedures
      : procedures.filter((procedure) => procedure.isObjectif)
    if (!needle) return availableProcedures

    return availableProcedures.filter((procedure) => {
      const haystack = [procedure.name, procedure.pathologie, procedure.categories?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [allowHorsObjectifs, procedures, query])

  async function handleSubmit(event) {
    event.preventDefault()

    const schemaError = validateRealisation(form)
    if (schemaError) { setError(schemaError); return }

    if (!form.ipp_patient.trim()) {
      setError("L’IPP patient est requis.")
      return
    }

    if (!allowHorsObjectifs && isHorsObjectifs) {
      setError(‘Ce geste n’est pas disponible pour votre année.’)
      return
    }

    if (compteRenduRequired && !form.compte_rendu.trim()) {
      setError(‘Le compte rendu opératoire est requis.’)
      return
    }

    const res = await execute(createRealisation, form)
    if (!res?.error) {
      toast.success('Acte soumis avec succès — en attente de validation.')
      router.push('/resident/historique')
    }
  }

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function selectProcedure(procedureId) {
    const nextProcedure = procedures.find((procedure) => procedure.id === procedureId)
    const nextService = normalizeService(nextProcedure?.service)
    setForm((current) => {
      const selectedTeacher = enseignants.find((enseignant) => enseignant.id === current.enseignant_id)
      const keepTeacher = selectedTeacher && normalizeService(selectedTeacher.service) === nextService
      return { ...current, procedure_id: procedureId, enseignant_id: keepTeacher ? current.enseignant_id : '' }
    })
    setError('')
  }

  return (
    <>
      <PageHeader title="Nouvel acte" />
      <StepProgress steps={completionSteps} />

      <form onSubmit={handleSubmit} className="space-y-4 pb-28 md:pb-0">
        <section className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>1. Geste</h2>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">A{residentYear}</span>
          </div>

          {form.procedure_id && selectedProc ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5"
              style={{ borderColor: 'var(--color-navy)', backgroundColor: 'var(--color-ice)' }}>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>{selectedProc.name}</p>
                {selectedProc.pathologie && <p className="mt-0.5 text-xs text-slate-500">{selectedProc.pathologie}</p>}
                <p className="mt-0.5 text-xs text-slate-500">{SERVICE_LABELS[selectedService] ?? SERVICE_LABELS[DEFAULT_SERVICE]}</p>
              </div>
              <button type="button" onClick={() => { setField('procedure_id', ''); setQuery('') }}
                className="flex-shrink-0 text-xs font-medium text-slate-400 hover:text-slate-600">
                Changer
              </button>
            </div>
          ) : (
            <div className="relative">
              <label className="relative block">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un geste..." autoComplete="off"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-sky-400" />
              </label>
              {query.trim().length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {filteredProcedures.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">Aucun geste trouvé</p>
                  ) : filteredProcedures.map((procedure) => (
                    <button key={procedure.id} type="button"
                      onClick={() => { selectProcedure(procedure.id); setQuery('') }}
                      className="flex w-full items-start justify-between gap-3 border-b border-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-50 last:border-0">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-800">{procedure.name}</span>
                        {procedure.pathologie && <span className="mt-0.5 block text-xs text-slate-500">{procedure.pathologie}</span>}
                        <span className="mt-0.5 block text-xs text-slate-400">{SERVICE_LABELS[normalizeService(procedure.service)]}</span>
                      </span>
                      <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={procedure.isObjectif
                          ? { backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }
                          : { backgroundColor: '#ffedd5', color: '#9a3412' }}>
                        {procedure.isObjectif ? 'Objectif' : 'Futur'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isHorsObjectifs && allowHorsObjectifs && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-700">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              Pas encore exigible. La saisie reste possible.
            </div>
          )}
          {!allowHorsObjectifs && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              Seuls les gestes de votre année sont disponibles.
            </div>
          )}
          {selectedProc?.objective && (
            <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-900">
              {selectedMissing > 0
                ? `Encore ${selectedMissing} acte${selectedMissing > 1 ? 's' : ''} pour atteindre l’objectif ${OBJECTIF_LEVEL_LABELS[selectedProc.objective.required_level]}.`
                : 'Objectif atteint.'}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>2. Date</h2>
          <Field label="Date de réalisation *">
            <input
              type="date"
              value={form.performed_at}
              onChange={(event) => setField('performed_at', event.target.value)}
              max={today}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
            />
          </Field>
        </section>

        <section className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>3. Niveau</h2>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITY_TYPES.map((activityType) => {
              const selected = form.activity_type === activityType.value
              return (
                <button
                  key={activityType.value}
                  type="button"
                  onClick={() => setField('activity_type', activityType.value)}
                  className="rounded-lg border-2 px-2 py-3 text-center transition"
                  style={selected ? { borderColor: 'var(--color-navy)', backgroundColor: 'var(--color-navy)', color: 'white' } : { borderColor: '#e2e8f0', color: '#374151', backgroundColor: 'white' }}
                >
                  <span className="inline-flex items-center justify-center gap-1 text-sm font-semibold">
                    {selected && <CheckCircle size={14} strokeWidth={2} />}
                    {activityType.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>4. Encadrant</h2>
          <Field label="Enseignant *">
            <select
              value={form.enseignant_id}
              onChange={(event) => setField('enseignant_id', event.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
            >
              <option value="">Choisir...</option>
              {filteredEnseignants.map((enseignant) => (
                <option key={enseignant.id} value={enseignant.id}>{enseignant.full_name}</option>
              ))}
            </select>
            {selectedProc && filteredEnseignants.length === 0 && (
              <p className="mt-2 text-xs text-orange-600">Aucun enseignant actif renseigne pour ce service.</p>
            )}
          </Field>
        </section>

        <section className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>5. IPP Patient</h2>
          <Field label="IPP patient *">
            <input
              type="text"
              value={form.ipp_patient}
              onChange={(event) => setField('ipp_patient', event.target.value)}
              placeholder="Identifiant patient"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
            />
          </Field>
        </section>

        <details className="group rounded-lg border border-slate-100 bg-white p-4 shadow-sm md:p-5" open={compteRenduRequired}>
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
            <span>Autres détails</span>
            <ChevronDown size={16} className="transition-transform duration-200 group-open:rotate-180 text-slate-400" />
          </summary>
          <div className="mt-4 space-y-4">
            <Field label="Résident superviseur">
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

            <Field label={`Compte rendu${compteRenduRequired ? ' *' : ''}`}>
              <textarea
                value={form.compte_rendu}
                onChange={(event) => setField('compte_rendu', event.target.value)}
                rows={4}
                required={compteRenduRequired}
                placeholder="Description de l’acte..."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
              />
            </Field>
            <Field label="Commentaire">
              <textarea
                value={form.commentaire}
                onChange={(event) => setField('commentaire', event.target.value)}
                rows={2}
                placeholder="Note personnelle..."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
              />
            </Field>
          </div>
        </details>

        {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

        <SubmitSummary selectedProc={selectedProc} activityType={form.activity_type} enseignants={enseignants} enseignantId={form.enseignant_id} />

        <div className="sticky bottom-20 z-20 flex gap-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <Link
            href="/resident"
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-navy)' }}
          >
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>{label}</span>
      {children}
    </label>
  )
}

function StepProgress({ steps }) {
  const completed = steps.filter((step) => step.done).length
  return (
    <div className="mb-4 rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progression</p>
        <p className="text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>{completed}/{steps.length}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step) => (
          <div key={step.label} className="min-w-0">
            <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: step.done ? '100%' : '0%', backgroundColor: step.done ? 'var(--color-success)' : 'transparent' }}
              />
            </div>
            <p className={`truncate text-[11px] font-medium ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SubmitSummary({ selectedProc, activityType, enseignants, enseignantId }) {
  if (!selectedProc && !activityType && !enseignantId) return null

  const activityLabel = ACTIVITY_TYPES.find((type) => type.value === activityType)?.label
  const enseignantName = enseignants.find((enseignant) => enseignant.id === enseignantId)?.full_name

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
      <p className="mb-2 font-semibold" style={{ color: 'var(--color-navy)' }}>Résumé avant envoi</p>
      <div className="grid gap-1.5 sm:grid-cols-3">
        <SummaryItem label="Geste" value={selectedProc?.name} />
        <SummaryItem label="Niveau" value={activityLabel} />
        <SummaryItem label="Encadrant" value={enseignantName} />
      </div>
    </div>
  )
}

function SummaryItem({ label, value }) {
  return (
    <div className="min-w-0">
      <span className="block text-[11px] text-slate-400">{label}</span>
      <span className="block truncate font-medium text-slate-700">{value || '-'}</span>
    </div>
  )
}
