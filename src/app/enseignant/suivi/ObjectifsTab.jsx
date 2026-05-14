'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Target, Users } from 'lucide-react'
import { SkeletonList } from '@/components/ui/SkeletonCard'
import { buildCurriculumObjectives, getCountForRequiredLevel, getMinimumForRequiredLevel, normalizeObjectifLevel, OBJECTIF_LEVEL_LABELS } from '@/lib/logbook'
import { getInitials, getResidentYear } from '@/lib/utils'

const LEVEL_STYLES = {
  1: { bg: 'var(--color-info-light)', color: 'var(--color-info)', label: 'Exposition' },
  2: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', label: 'Sous supervision' },
  3: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: 'Autonomie' },
}

function totalActs(progressRow) {
  if (!progressRow) return 0
  return (progressRow.count_expose ?? 0) + (progressRow.count_supervise ?? 0) + (progressRow.count_autonome ?? 0)
}

function pct(done, total) {
  return total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
}

function getObjectiveForResident(procedure, objectives, residentYear) {
  const eligible = objectives
    .filter((objective) => objective.year <= residentYear)
    .sort((a, b) => {
      if (a.required_level !== b.required_level) return b.required_level - a.required_level
      return b.year - a.year
    })

  if (eligible[0]) return eligible[0]

  if (normalizeObjectifLevel(procedure?.objectif_final) !== 1) return null

  return {
    procedure_id: procedure.id,
    required_level: 1,
    year: 1,
    min_count: getMinimumForRequiredLevel(procedure, 1),
    procedures: procedure,
  }
}

export default function ObjectifsTab({ residents }) {
  const [procedures, setProcedures] = useState([])
  const [objectives, setObjectives] = useState([])
  const [progressIndex, setProgressIndex] = useState({})
  const [selectedProcedureId, setSelectedProcedureId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      const supabase = createClient()
      const ids = residents.map((resident) => resident.id)
      const [objectivesRes, proceduresRes, progressRes] = await Promise.all([
        supabase
          .from('procedure_objectives')
          .select('procedure_id, year, required_level, min_count')
          .eq('is_active', true)
          .order('year'),
        supabase
          .from('procedures')
          .select('id, name, pathologie, objectif_final, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, seuil_deblocage_autonomie, categories(name, color_hex)')
          .eq('is_active', true)
          .order('name'),
        ids.length
          ? supabase
            .from('v_resident_niveau')
            .select('resident_id, procedure_id, count_expose, count_supervise, count_autonome')
            .in('resident_id', ids)
          : Promise.resolve({ data: [] }),
      ])

      if (!active) return

      const nextProcedures = proceduresRes.data ?? []
      const curriculum = buildCurriculumObjectives({
        procedures: nextProcedures,
        objectiveRows: objectivesRes.data ?? [],
      })

      const nextProgress = {}
      for (const row of progressRes.data ?? []) {
        if (!nextProgress[row.procedure_id]) nextProgress[row.procedure_id] = {}
        nextProgress[row.procedure_id][row.resident_id] = row
      }

      setProcedures(nextProcedures)
      setObjectives(curriculum.all)
      setProgressIndex(nextProgress)
      setSelectedProcedureId((current) => current || nextProcedures[0]?.id || '')
      setLoading(false)
    }

    loadData()

    return () => {
      active = false
    }
  }, [residents])

  const selectedProcedure = useMemo(
    () => procedures.find((procedure) => procedure.id === selectedProcedureId) ?? procedures[0],
    [procedures, selectedProcedureId],
  )

  const procedureObjectives = useMemo(() => {
    if (!selectedProcedure) return []
    return objectives
      .filter((objective) => objective.procedure_id === selectedProcedure.id)
      .sort((a, b) => {
        if (a.required_level !== b.required_level) return b.required_level - a.required_level
        return (a.year ?? 1) - (b.year ?? 1)
      })
  }, [objectives, selectedProcedure])

  const rows = useMemo(() => {
    if (!selectedProcedure) return []
    const byResident = progressIndex[selectedProcedure.id] ?? {}

    return residents
      .map((resident) => {
        const year = getResidentYear(resident.residanat_start_date)
        const objective = getObjectiveForResident(selectedProcedure, procedureObjectives, year)
        const progress = byResident[resident.id]
        const count = objective ? getCountForRequiredLevel(progress, objective.required_level) : 0
        const acts = totalActs(progress)
        const reached = objective ? count >= objective.min_count : false

        return {
          resident,
          year,
          objective,
          progress,
          acts,
          count,
          reached,
          pct: objective ? pct(count, objective.min_count) : 0,
        }
      })
      .sort((a, b) => {
        if (Boolean(a.objective) !== Boolean(b.objective)) return a.objective ? -1 : 1
        if (a.reached !== b.reached) return a.reached ? -1 : 1
        if (b.acts !== a.acts) return b.acts - a.acts
        return a.resident.full_name.localeCompare(b.resident.full_name)
      })
  }, [progressIndex, procedureObjectives, residents, selectedProcedure])

  if (loading) return <SkeletonList count={5} variant="row" />

  if (!selectedProcedure) {
    return <p className="py-10 text-center text-sm text-slate-400">Aucun geste actif</p>
  }

  const category = selectedProcedure.categories
  const finalLevel = normalizeObjectifLevel(selectedProcedure.objectif_final)
  const finalStyle = LEVEL_STYLES[finalLevel] ?? LEVEL_STYLES[1]
  const realizedRows = rows.filter((row) => row.acts > 0)
  const reachedRows = rows.filter((row) => row.reached)
  const eligibleRows = rows.filter((row) => row.objective)
  const totalValidatedActs = rows.reduce((sum, row) => sum + row.acts, 0)
  const reachedPct = pct(reachedRows.length, eligibleRows.length)

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Suivi par geste</p>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <select
          value={selectedProcedure.id}
          onChange={(event) => setSelectedProcedureId(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-400"
        >
          {procedures.map((procedure) => (
            <option key={procedure.id} value={procedure.id}>
              {procedure.name}{procedure.pathologie ? ` - ${procedure.pathologie}` : ''}
            </option>
          ))}
        </select>
      </div>

      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>{selectedProcedure.name}</h2>
              <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: finalStyle.bg, color: finalStyle.color }}>
                Objectif final: {OBJECTIF_LEVEL_LABELS[finalLevel] ?? '-'}
              </span>
              {category && (
                <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${category.color_hex}25`, color: category.color_hex }}>
                  {category.name}
                </span>
              )}
            </div>
            {selectedProcedure.pathologie && <p className="mt-1 text-xs text-slate-500">{selectedProcedure.pathologie}</p>}
          </div>
          <span className="text-lg font-bold" style={{ color: finalStyle.color }}>{reachedPct}%</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Metric icon={Target} label="Realisations validees" value={totalValidatedActs} />
          <Metric icon={Users} label="Residents ayant realise" value={`${realizedRows.length}/${rows.length}`} />
          <Metric icon={CheckCircle2} label="Objectif atteint" value={`${reachedRows.length}/${eligibleRows.length}`} />
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full" style={{ width: `${reachedPct}%`, backgroundColor: finalStyle.color }} />
        </div>
      </section>

      <section className="mb-4 grid gap-3 md:grid-cols-3">
        {[1, 2, 3].map((level) => {
          const style = LEVEL_STYLES[level]
          const target = procedureObjectives.find((objective) => objective.required_level === level)
          const minCount = target?.min_count ?? (finalLevel === level ? getMinimumForRequiredLevel(selectedProcedure, level) : null)
          return (
            <div key={level} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold" style={{ color: style.color }}>{style.label}</p>
              <p className="mt-1 text-lg font-bold" style={{ color: style.color }}>
                {minCount ? `${minCount} acte${minCount > 1 ? 's' : ''}` : '-'}
              </p>
              <p className="text-xs text-slate-500">
                {target ? (level === 1 ? 'Transversal' : `A partir de A${target.year}`) : 'Non retenu comme objectif'}
              </p>
            </div>
          )
        })}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Residents</p>
          <p className="text-xs text-slate-500">{realizedRows.length} avec realisation · {reachedRows.length}/{eligibleRows.length} objectif atteint</p>
        </div>

        <div className="space-y-2">
          {rows.map((row) => {
            const objective = row.objective
            const style = LEVEL_STYLES[objective?.required_level] ?? finalStyle
            return (
              <Link
                key={row.resident.id}
                href={`/enseignant/residents/${row.resident.id}`}
                className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: 'var(--color-ice)', color: 'var(--color-navy)' }}>
                    {getInitials(row.resident.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{row.resident.full_name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">A{row.year}</span>
                      {objective && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: style.bg, color: style.color }}>
                          {OBJECTIF_LEVEL_LABELS[objective.required_level]}
                        </span>
                      )}
                      {!objective && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          Non attendu
                        </span>
                      )}
                      {row.reached && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 size={12} />
                          atteint
                        </span>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-4">
                      <SmallCount label="Total" value={row.acts} />
                      <SmallCount label="Expose" value={row.progress?.count_expose ?? 0} />
                      <SmallCount label="Supervise" value={row.progress?.count_supervise ?? 0} />
                      <SmallCount label="Autonome" value={row.progress?.count_autonome ?? 0} />
                    </div>

                    {objective && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: style.color }} />
                        </div>
                        <span className="w-16 text-right text-xs font-semibold" style={{ color: style.color }}>
                          {row.count}/{objective.min_count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-ice)', color: 'var(--color-navy)' }}>
        <Icon size={17} />
      </div>
      <div>
        <p className="text-lg font-bold leading-none" style={{ color: 'var(--color-navy)' }}>{value}</p>
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function SmallCount({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-sm font-bold" style={{ color: 'var(--color-navy)' }}>{value}</p>
    </div>
  )
}
