'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, ChevronRight, Target, TrendingUp } from 'lucide-react'
import { SkeletonList } from '@/components/ui/SkeletonCard'
import { buildCurriculumObjectives, enrichObjectiveProgress, getCountForRequiredLevel, normalizeObjectifLevel, OBJECTIF_LEVEL_LABELS } from '@/lib/logbook'
import { getInitials, getResidentYear } from '@/lib/utils'

const LEVEL_STYLES = {
  1: { bg: 'var(--color-info-light)', color: 'var(--color-info)' },
  2: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  3: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
}

function totalActs(row) {
  if (!row) return 0
  return (row.count_expose ?? 0) + (row.count_supervise ?? 0) + (row.count_autonome ?? 0)
}

function pct(done, total) {
  return total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
}

export default function PrioritesTab({ residents }) {
  const [state, setState] = useState({ residentsAtRisk: [], lowCoverage: [], almostDone: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      const supabase = createClient()
      const ids = residents.map((resident) => resident.id)
      const [progressRes, objectivesRes, proceduresRes] = await Promise.all([
        ids.length
          ? supabase
            .from('v_resident_niveau')
            .select('resident_id, procedure_id, count_expose, count_supervise, count_autonome')
            .in('resident_id', ids)
          : Promise.resolve({ data: [] }),
        supabase
          .from('procedure_objectives')
          .select('procedure_id, year, required_level, min_count')
          .eq('is_active', true),
        supabase
          .from('procedures')
          .select('id, name, pathologie, objectif_final, target_level, target_count, target_year, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, seuil_deblocage_autonomie, categories(name, color_hex)')
          .eq('is_active', true),
      ])

      if (!active) return

      const progressByResident = {}
      const progressByProcedure = {}
      for (const row of progressRes.data ?? []) {
        if (!progressByResident[row.resident_id]) progressByResident[row.resident_id] = {}
        if (!progressByProcedure[row.procedure_id]) progressByProcedure[row.procedure_id] = []
        progressByResident[row.resident_id][row.procedure_id] = row
        progressByProcedure[row.procedure_id].push(row)
      }

      const curriculum = buildCurriculumObjectives({
        procedures: proceduresRes.data ?? [],
        objectiveRows: objectivesRes.data ?? [],
      })
      const objectives = curriculum.all
      const residentsAtRisk = []
      const almostDone = []

      for (const resident of residents) {
        const year = getResidentYear(resident.residanat_start_date)
        const progressIndex = progressByResident[resident.id] ?? {}
        const enriched = enrichObjectiveProgress(objectives, progressIndex)
        const done = enriched.filter((objective) => objective.done).length
        const late = enriched.filter((objective) => objective.year < year && !objective.done)

        if (late.length > 0) {
          residentsAtRisk.push({
            resident,
            year,
            lateCount: late.length,
            pct: pct(done, enriched.length),
          })
        }

        for (const objective of enriched) {
          if (objective.done || objective.year > year) continue
          const missing = objective.min_count - objective.count
          if (objective.count > 0 && (missing <= 2 || objective.pct >= 50)) {
            almostDone.push({
              resident,
              year,
              objective,
              missing,
            })
          }
        }
      }

      const objectiveProcedures = new Map()
      for (const objective of objectives) {
        if (objective.procedure_id && objective.procedures) {
          objectiveProcedures.set(objective.procedure_id, objective.procedures)
        }
      }

      const lowCoverage = Array.from(objectiveProcedures.values())
        .map((procedure) => {
          const rows = progressByProcedure[procedure.id] ?? []
          const residentsWithActs = rows.filter((row) => totalActs(row) > 0).length
          const acts = rows.reduce((sum, row) => sum + totalActs(row), 0)
          return {
            procedure,
            residentsWithActs,
            acts,
            finalLevel: normalizeObjectifLevel(procedure.target_level) || normalizeObjectifLevel(procedure.objectif_final),
          }
        })
        .sort((a, b) => {
          if (a.residentsWithActs !== b.residentsWithActs) return a.residentsWithActs - b.residentsWithActs
          if (a.acts !== b.acts) return a.acts - b.acts
          return a.procedure.name.localeCompare(b.procedure.name)
        })
        .slice(0, 6)

      setState({
        residentsAtRisk: residentsAtRisk
          .sort((a, b) => {
            if (b.lateCount !== a.lateCount) return b.lateCount - a.lateCount
            return a.pct - b.pct
          })
          .slice(0, 5),
        lowCoverage,
        almostDone: almostDone
          .sort((a, b) => {
            if (a.missing !== b.missing) return a.missing - b.missing
            return b.objective.pct - a.objective.pct
          })
          .slice(0, 6),
      })
      setLoading(false)
    }

    loadData()

    return () => {
      active = false
    }
  }, [residents])

  const hasAnyPriority = useMemo(
    () => state.residentsAtRisk.length > 0 || state.lowCoverage.length > 0 || state.almostDone.length > 0,
    [state],
  )

  if (loading) return <SkeletonList count={5} variant="row" />

  if (!hasAnyPriority) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Aucune priorité détectée</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PrioritySection title="Résidents à surveiller" className="lg:col-span-1">
        {state.residentsAtRisk.length === 0 ? (
          <EmptyLine text="Aucun retard notable" />
        ) : state.residentsAtRisk.map((item) => (
          <Link key={item.resident.id} href={`/enseignant/residents/${item.resident.id}`} className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: 'var(--color-ice)', color: 'var(--color-navy)' }}>
                {getInitials(item.resident.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.resident.full_name}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">A{item.year}</span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                    <AlertTriangle size={12} />
                    {item.lateCount}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: 'var(--color-warning)' }} />
                </div>
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--color-warning)' }}>{item.pct}%</span>
            </div>
          </Link>
        ))}
      </PrioritySection>

      <PrioritySection title="Objectifs proches">
        {state.almostDone.length === 0 ? (
          <EmptyLine text="Aucun objectif proche" />
        ) : state.almostDone.map((item) => {
          const style = LEVEL_STYLES[item.objective.required_level] ?? LEVEL_STYLES[1]
          return (
            <Link key={`${item.resident.id}-${item.objective.procedure_id}-${item.objective.required_level}`} href={`/enseignant/residents/${item.resident.id}`} className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: style.bg, color: style.color }}>
                  <TrendingUp size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800">{item.objective.procedures?.name ?? 'Geste'}</p>
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: style.bg, color: style.color }}>
                      {OBJECTIF_LEVEL_LABELS[item.objective.required_level]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.resident.full_name} · {item.objective.count}/{item.objective.min_count}</p>
                </div>
                <ChevronRight size={16} className="mt-1 text-slate-300" />
              </div>
            </Link>
          )
        })}
      </PrioritySection>

      <PrioritySection title="Gestes peu couverts" className="lg:col-span-2">
        <div className="grid gap-3 md:grid-cols-2">
          {state.lowCoverage.map((item) => {
            const style = LEVEL_STYLES[item.finalLevel] ?? LEVEL_STYLES[1]
            const category = item.procedure.categories
            return (
              <div key={item.procedure.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: style.bg, color: style.color }}>
                    <Target size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{item.procedure.name}</p>
                      {category && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${category.color_hex}25`, color: category.color_hex }}>
                          {category.name}
                        </span>
                      )}
                    </div>
                    {item.procedure.pathologie && <p className="mt-0.5 text-xs text-slate-500">{item.procedure.pathologie}</p>}
                    <p className="mt-2 text-xs text-slate-500">
                      {item.residentsWithActs}/{residents.length} résidents · {item.acts} actes
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </PrioritySection>
    </div>
  )
}

function PrioritySection({ title, className = '', children }) {
  return (
    <section className={className}>
      <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function EmptyLine({ text }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-400 shadow-sm">
      {text}
    </div>
  )
}
