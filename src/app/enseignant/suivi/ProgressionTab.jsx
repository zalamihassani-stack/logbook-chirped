'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { SkeletonList } from '@/components/ui/SkeletonCard'
import { getInitials, getResidentYear } from '@/lib/utils'
import { buildCurriculumObjectives, enrichObjectiveProgress, getCountForRequiredLevel, OBJECTIF_LEVEL_LABELS } from '@/lib/logbook'

const LEVELS = [3, 2, 1]
const LEVEL_STYLES = {
  1: { bg: 'var(--color-info-light)', color: 'var(--color-info)' },
  2: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  3: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
}

function emptyLevelSummary() {
  return {
    1: { done: 0, total: 0 },
    2: { done: 0, total: 0 },
    3: { done: 0, total: 0 },
  }
}

function percent(done, total) {
  return total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
}

export default function ProgressionTab({ residents }) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let active = true

    async function loadStats() {
      if (residents.length === 0) {
        if (active) {
          setData({})
          setLoading(false)
        }
        return
      }

      setLoading(true)
      const supabase = createClient()
      const ids = residents.map((resident) => resident.id)

      const [progressRes, travauxRes, objectivesRes, proceduresRes] = await Promise.all([
        supabase.from('v_resident_niveau').select('resident_id, procedure_id, count_expose, count_supervise, count_autonome').in('resident_id', ids),
        supabase.from('travaux_scientifiques').select('resident_id').in('resident_id', ids),
        supabase
          .from('procedure_objectives')
          .select('procedure_id, year, required_level, min_count')
          .eq('is_active', true),
        supabase
          .from('procedures')
          .select('id, name, objectif_final, target_level, target_count, target_year, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, seuil_deblocage_autonomie')
          .eq('is_active', true),
      ])

      const progressByResident = {}
      for (const row of progressRes.data ?? []) {
        if (!progressByResident[row.resident_id]) progressByResident[row.resident_id] = {}
        progressByResident[row.resident_id][row.procedure_id] = row
      }

      const travauxByResident = {}
      for (const travail of travauxRes.data ?? []) {
        travauxByResident[travail.resident_id] = (travauxByResident[travail.resident_id] ?? 0) + 1
      }

      const curriculum = buildCurriculumObjectives({
        procedures: proceduresRes.data ?? [],
        objectiveRows: objectivesRes.data ?? [],
      })
      const objectives = curriculum.all
      const result = {}

      for (const resident of residents) {
        const year = getResidentYear(resident.residanat_start_date)
        const progressIndex = progressByResident[resident.id] ?? {}
        const enrichedObjectives = enrichObjectiveProgress(objectives, progressIndex)
        const globalObjectives = enrichedObjectives
        const dueObjectives = objectives.filter((objective) => objective.year <= year)
        const levelSummary = emptyLevelSummary()
        const late = []
        let done = 0

        for (const objective of globalObjectives) {
          levelSummary[objective.required_level].total += 1
          if (objective.done) {
            done += 1
            levelSummary[objective.required_level].done += 1
          }
        }

        for (const objective of dueObjectives) {
          const count = getCountForRequiredLevel(progressIndex[objective.procedure_id], objective.required_level)
          const isDone = count >= objective.min_count
          if (!isDone && objective.year < year) {
            late.push({
              name: objective.procedures?.name ?? 'Geste',
              year: objective.year,
              required_level: objective.required_level,
              count,
              min_count: objective.min_count,
            })
          }
        }

        result[resident.id] = {
          year,
          done,
          total: globalObjectives.length,
          pct: percent(done, globalObjectives.length),
          late,
          levels: levelSummary,
          travaux: travauxByResident[resident.id] ?? 0,
        }
      }

      if (active) {
        setData(result)
        setLoading(false)
      }
    }

    loadStats()

    return () => {
      active = false
    }
  }, [residents])

  const sorted = useMemo(() => {
    return [...residents]
      .filter((resident) => {
        if (filter === 'late') return (data[resident.id]?.late.length ?? 0) > 0
        return true
      })
      .sort((a, b) => {
        const statsA = data[a.id] ?? { pct: 0, late: [] }
        const statsB = data[b.id] ?? { pct: 0, late: [] }
        if (statsB.late.length !== statsA.late.length) return statsB.late.length - statsA.late.length
        return statsA.pct - statsB.pct
      })
  }, [data, filter, residents])

  if (loading) return <SkeletonList count={4} />

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Vue par resident</p>
        </div>
        <div className="flex gap-2">
          {[
            ['all', 'Tous'],
            ['late', 'En retard'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className="rounded-full px-3 py-1.5 text-xs font-medium"
              style={filter === key
                ? { backgroundColor: 'var(--color-navy)', color: 'white' }
                : { backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((resident) => {
          const stats = data[resident.id] ?? { done: 0, total: 0, pct: 0, late: [], levels: emptyLevelSummary(), travaux: 0, year: 1 }
          const color = stats.pct >= 80 ? 'var(--color-success)' : stats.pct >= 50 ? 'var(--color-navy)' : 'var(--color-warning)'

          return (
            <Link
              key={resident.id}
              href={`/enseignant/residents/${resident.id}`}
              className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: 'var(--color-ice)', color: 'var(--color-navy)' }}>
                  {getInitials(resident.full_name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{resident.full_name}</p>
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-ice)', color: 'var(--color-navy)' }}>
                      A{stats.year}
                    </span>
                    {stats.late.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                        <AlertTriangle size={12} />
                        {stats.late.length} retard
                      </span>
                    )}
                  </div>

                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full transition-all" style={{ width: `${stats.pct}%`, backgroundColor: color }} />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {LEVELS.map((level) => {
                      const levelStats = stats.levels[level]
                      const style = LEVEL_STYLES[level]
                      return (
                        <div key={level} className="rounded-xl px-3 py-2" style={{ backgroundColor: style.bg }}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[11px] font-semibold" style={{ color: style.color }}>
                              {OBJECTIF_LEVEL_LABELS[level]}
                            </span>
                            <span className="text-xs font-bold" style={{ color: style.color }}>
                              {levelStats.done}/{levelStats.total}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {stats.done}/{stats.total} objectifs atteints · {stats.travaux} travaux
                  </p>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="text-sm font-bold" style={{ color }}>{stats.pct}%</span>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </div>
            </Link>
          )
        })}

        {sorted.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">Aucun resident pour ce filtre</p>
        )}
      </div>
    </div>
  )
}
