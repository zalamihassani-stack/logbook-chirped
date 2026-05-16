'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, ChevronRight, Search } from 'lucide-react'
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

const YEAR_OPTIONS = [1, 2, 3, 4, 5]

export default function ProgressionTab({ residents }) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState(0)

  useEffect(() => {
    let active = true

    async function loadStats() {
      if (residents.length === 0) {
        if (active) { setData({}); setLoading(false) }
        return
      }

      setLoading(true)
      const supabase = createClient()
      const ids = residents.map((r) => r.id)

      const [progressRes, travauxRes, objectivesRes, proceduresRes] = await Promise.all([
        supabase.from('v_resident_niveau').select('resident_id, procedure_id, count_expose, count_supervise, count_autonome').in('resident_id', ids),
        supabase.from('travaux_scientifiques').select('resident_id').in('resident_id', ids),
        supabase.from('procedure_objectives').select('procedure_id, year, required_level, min_count').eq('is_active', true),
        supabase.from('procedures').select('id, name, objectif_final, target_level, target_count, target_year, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, seuil_deblocage_autonomie').eq('is_active', true),
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
        const enriched = enrichObjectiveProgress(objectives, progressIndex)
        const levelSummary = emptyLevelSummary()
        const late = []
        let done = 0

        for (const obj of enriched) {
          levelSummary[obj.required_level].total += 1
          if (obj.done) {
            done += 1
            levelSummary[obj.required_level].done += 1
          }
        }

        const dueObjectives = objectives.filter((obj) => obj.year <= year)
        for (const obj of dueObjectives) {
          const count = getCountForRequiredLevel(progressIndex[obj.procedure_id], obj.required_level)
          if (count < obj.min_count && obj.year < year) {
            late.push({ name: obj.procedures?.name ?? 'Geste', year: obj.year, required_level: obj.required_level, count, min_count: obj.min_count })
          }
        }

        // Progression annuelle = objectifs introduits cette année
        const annualObjectives = enriched.filter((obj) => obj.year === year)
        const annualDone = annualObjectives.filter((obj) => obj.done).length
        const annualTotal = annualObjectives.length

        result[resident.id] = {
          year,
          done,
          total: enriched.length,
          pct: percent(done, enriched.length),
          annualDone,
          annualTotal,
          annualPct: percent(annualDone, annualTotal),
          late,
          levels: levelSummary,
          travaux: travauxByResident[resident.id] ?? 0,
        }
      }

      if (active) { setData(result); setLoading(false) }
    }

    loadStats()
    return () => { active = false }
  }, [residents])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...residents]
      .filter((r) => {
        if (q && !r.full_name.toLowerCase().includes(q)) return false
        if (yearFilter && (data[r.id]?.year ?? 0) !== yearFilter) return false
        return true
      })
      .sort((a, b) => {
        const sA = data[a.id] ?? { annualPct: 0, pct: 0 }
        const sB = data[b.id] ?? { annualPct: 0, pct: 0 }
        if (sA.annualPct !== sB.annualPct) return sA.annualPct - sB.annualPct
        return sA.pct - sB.pct
      })
  }, [data, search, yearFilter, residents])

  if (loading) return <SkeletonList count={4} />

  return (
    <div>
      {/* Barre de recherche + filtre par année */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un résident..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-400"
          />
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setYearFilter(0)}
            className="rounded-full px-3 py-1.5 text-xs font-medium"
            style={yearFilter === 0
              ? { backgroundColor: 'var(--color-navy)', color: 'white' }
              : { backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0' }}
          >
            Tous
          </button>
          {YEAR_OPTIONS.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYearFilter(yearFilter === y ? 0 : y)}
              className="rounded-full px-3 py-1.5 text-xs font-medium"
              style={yearFilter === y
                ? { backgroundColor: 'var(--color-navy)', color: 'white' }
                : { backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0' }}
            >
              A{y}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-400">{filtered.length} résident{filtered.length !== 1 ? 's' : ''} · triés par progression annuelle</p>

      <div className="space-y-3">
        {filtered.map((resident) => {
          const stats = data[resident.id] ?? { done: 0, total: 0, pct: 0, annualDone: 0, annualTotal: 0, annualPct: 0, late: [], levels: emptyLevelSummary(), travaux: 0, year: 1 }
          const globalColor = stats.pct >= 80 ? 'var(--color-success)' : stats.pct >= 50 ? 'var(--color-navy)' : 'var(--color-warning)'
          const annualColor = stats.annualPct >= 80 ? 'var(--color-success)' : stats.annualPct >= 50 ? 'var(--color-navy)' : 'var(--color-warning)'

          return (
            <Link
              key={resident.id}
              href={`/enseignant/residents/${resident.id}`}
              className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-row items-start gap-3 sm:gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: 'var(--color-ice)', color: 'var(--color-navy)' }}>
                  {getInitials(resident.full_name)}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Nom + badges */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{resident.full_name}</p>
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-ice)', color: 'var(--color-navy)' }}>
                      A{stats.year}
                    </span>
                    {stats.late.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                        <AlertTriangle size={11} />
                        {stats.late.length} en retard
                      </span>
                    )}
                  </div>

                  {/* Progression annuelle */}
                  <div className="mb-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Cette année</span>
                      <span className="text-[11px] font-bold" style={{ color: annualColor }}>
                        {stats.annualDone}/{stats.annualTotal}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full transition-all" style={{ width: `${stats.annualPct}%`, backgroundColor: annualColor }} />
                    </div>
                  </div>

                  {/* Progression globale */}
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">Global</span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {stats.done}/{stats.total}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full transition-all" style={{ width: `${stats.pct}%`, backgroundColor: globalColor }} />
                    </div>
                  </div>

                  {/* Niveaux */}
                  <div className="grid grid-cols-3 gap-2">
                    {LEVELS.map((level) => {
                      const ls = stats.levels[level]
                      const style = LEVEL_STYLES[level]
                      return (
                        <div key={level} className="rounded-xl px-2 py-1.5" style={{ backgroundColor: style.bg }}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate text-[10px] font-semibold" style={{ color: style.color }}>
                              {OBJECTIF_LEVEL_LABELS[level]}
                            </span>
                            <span className="text-[11px] font-bold" style={{ color: style.color }}>
                              {ls.done}/{ls.total}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <p className="mt-2 text-xs text-slate-400">{stats.travaux} travaux scientifiques</p>
                </div>

                <div className="flex flex-shrink-0 items-start pt-1">
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </div>
            </Link>
          )
        })}

        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">Aucun résident pour ces filtres</p>
        )}
      </div>
    </div>
  )
}
