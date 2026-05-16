import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import { getResidentYear } from '@/lib/utils'
import { OBJECTIF_LEVEL_LABELS, getResidentProgressRows, indexProgressByProcedure, getCountForRequiredLevel, procedureToGlobalObjective } from '@/lib/logbook'
import { CheckCircle2, Clock3, ListChecks, Target } from 'lucide-react'

const LEVEL_STYLE = {
  1: { bg: 'var(--color-info-light)', color: 'var(--color-info)', label: 'Exposition' },
  2: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', label: 'Supervision' },
  3: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: 'Maitrise' },
}

function progressBadge(objective) {
  if (objective.done) return { bg: 'var(--color-success-light)', color: 'var(--color-success)', text: `OK ${objective.count}/${objective.min_count}` }
  if (objective.isFuture) return { bg: '#f1f5f9', color: '#64748b', text: `A${objective.year}` }
  if (objective.count > 0) return { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', text: `${objective.count}/${objective.min_count}` }
  return { bg: '#f1f5f9', color: '#64748b', text: `0/${objective.min_count}` }
}

function enrichObjective(objective, progressIndex, residentYear) {
  const count = getCountForRequiredLevel(progressIndex[objective.procedure_id], objective.required_level)
  const missing = Math.max(0, objective.min_count - count)
  const done = missing === 0
  const isFuture = objective.year > residentYear
  const isLate = !done && objective.year < residentYear
  const isAlmostDone = !done && !isFuture && missing === 1
  const isNotStarted = !done && !isFuture && count === 0
  const pct = objective.min_count ? Math.min(100, Math.round((count / objective.min_count) * 100)) : 0
  return { ...objective, count, missing, done, isFuture, isLate, isAlmostDone, isNotStarted, pct }
}

function summarize(objectives) {
  const total = objectives.length
  const done = objectives.filter((objective) => objective.done).length
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
}

function scopedHref(scope, level = '') {
  const params = new URLSearchParams()
  if (scope === 'formation') params.set('scope', 'formation')
  if (level) params.set('level', level)
  const query = params.toString()
  return query ? `/resident/progression?${query}` : '/resident/progression'
}

export default async function ProgressionPage({ searchParams }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const scope = params?.scope === 'formation' ? 'formation' : 'exigible'
  const selectedLevel = ['1', '2', '3'].includes(params?.level) ? Number(params.level) : 3

  const { data: profile } = await supabase
    .from('profiles')
    .select('residanat_start_date')
    .eq('id', user.id)
    .single()
  const residentYear = getResidentYear(profile?.residanat_start_date)

  const [progressRows, proceduresRes] = await Promise.all([
    getResidentProgressRows(supabase, user.id),
    supabase
      .from('procedures')
      .select('id, name, pathologie, category_id, objectif_final, target_level, target_count, target_year, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, categories(name, color_hex)')
      .eq('is_active', true),
  ])

  const progressIndex = indexProgressByProcedure(progressRows)
  const allObjectives = (proceduresRes.data ?? [])
    .map(procedureToGlobalObjective)
    .filter((objective) => objective?.required_level)
    .map((objective) => enrichObjective(objective, progressIndex, residentYear))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      if (a.isFuture !== b.isFuture) return a.isFuture ? 1 : -1
      if (a.year !== b.year) return a.year - b.year
      return (a.procedures?.name ?? '').localeCompare(b.procedures?.name ?? '')
    })

  const scopeObjectives = allObjectives.filter((objective) => scope === 'formation' || objective.year <= residentYear)
  const summary = summarize(scopeObjectives)
  const byLevel = [1, 2, 3].map((level) => {
    const objectives = scopeObjectives.filter((objective) => objective.required_level === level)
    return { level, objectives, ...summarize(objectives) }
  })
  const selectedLevelGroup = byLevel.find((group) => group.level === selectedLevel) ?? byLevel[2]

  return (
    <div className="max-w-5xl p-5 md:p-8">
      <PageHeader
        title="Progression"
        subtitle={scope === 'formation' ? `${summary.done}/${summary.total} geste(s) au niveau attendu` : `Annee en cours - objectifs jusqu'en A${residentYear}`}
      />

      <section className="mb-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Vue d&apos;ensemble</p>
            <p className="mt-0.5 text-xs text-slate-500">{summary.done}/{summary.total} objectifs atteints</p>
          </div>
          <span className="text-3xl font-bold" style={{ color: summary.pct >= 80 ? 'var(--color-success)' : 'var(--color-navy)' }}>
            {summary.pct}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full transition-all" style={{ width: `${summary.pct}%`, backgroundColor: summary.pct >= 80 ? 'var(--color-success)' : summary.pct >= 50 ? 'var(--color-navy)' : 'var(--color-warning)' }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <ScopeLink active={scope === 'exigible'} href={scopedHref('exigible', selectedLevel)} label="Annee en cours" />
          <ScopeLink active={scope === 'formation'} href={scopedHref('formation', selectedLevel)} label="Progression globale" />
        </div>
      </section>

      <section className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        {byLevel.map((item) => {
          const style = LEVEL_STYLE[item.level]
          return (
            <Link
              key={item.level}
              href={scopedHref(scope, item.level)}
              className="rounded-2xl border bg-white p-2.5 shadow-sm transition hover:shadow-md sm:p-4"
              style={{ borderColor: selectedLevel === item.level ? 'var(--color-navy)' : '#f1f5f9' }}
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl sm:mb-3 sm:h-9 sm:w-9" style={{ backgroundColor: style.bg, color: style.color }}>
                <Target size={16} strokeWidth={1.8} />
              </div>
              <p className="truncate text-[11px] font-semibold sm:text-xs" style={{ color: style.color }}>{style.label}</p>
              <p className="mt-1 text-lg font-bold sm:text-2xl" style={{ color: 'var(--color-navy)' }}>{item.done}/{item.total}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 sm:mt-3 sm:h-2">
                <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: style.color }} />
              </div>
            </Link>
          )
        })}
      </section>

      <div className="space-y-5">
        <LevelSection group={selectedLevelGroup} />
      </div>
    </div>
  )
}

function ScopeLink({ href, label, active }) {
  return (
    <Link
      href={href}
      className="rounded-xl px-3 py-2 text-center text-xs font-semibold transition"
      style={active ? { backgroundColor: 'var(--color-ice)', color: 'var(--color-navy)' } : { backgroundColor: '#f8fafc', color: '#64748b' }}
    >
      {label}
    </Link>
  )
}

function LevelSection({ group }) {
  const style = LEVEL_STYLE[group.level]
  const remaining = group.objectives.filter((objective) => !objective.done)
  const completed = group.objectives.filter((objective) => objective.done)
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>{style.label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{group.done}/{group.total} objectifs atteints</p>
        </div>
        <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: style.bg, color: style.color }}>{group.pct}%</span>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {remaining.map((objective) => <ObjectiveCard key={`${group.level}-${objective.procedure_id}`} objective={objective} />)}
        {remaining.length === 0 && <p className="rounded-xl bg-emerald-50 px-3 py-4 text-center text-sm text-emerald-700">Tous les objectifs de ce niveau sont atteints.</p>}
      </div>
      {completed.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-slate-500">Objectifs atteints ({completed.length})</summary>
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            {completed.map((objective) => <ObjectiveCard key={`done-${group.level}-${objective.procedure_id}`} objective={objective} />)}
          </div>
        </details>
      )}
    </section>
  )
}

function ObjectiveCard({ objective, showYear = true }) {
  const procedure = objective.procedures
  const category = procedure?.categories
  const levelStyle = LEVEL_STYLE[objective.required_level]
  const progress = progressBadge(objective)
  const Icon = objective.done ? CheckCircle2 : objective.isFuture ? ListChecks : objective.isLate ? Clock3 : Target

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white" style={{ color: objective.done ? 'var(--color-success)' : levelStyle.color }}>
          <Icon size={17} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-slate-800">{procedure?.name ?? '-'}</p>
              {procedure?.pathologie && <p className="mt-0.5 text-xs text-slate-500">{procedure.pathologie}</p>}
            </div>
            <span className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: progress.bg, color: progress.color }}>
              {progress.text}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {showYear && <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">A{objective.year}</span>}
            {category && (
              <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: `${category.color_hex}20`, color: category.color_hex }}>
                {category.name}
              </span>
            )}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full transition-all" style={{ width: `${objective.pct}%`, backgroundColor: objective.done ? 'var(--color-success)' : levelStyle.color }} />
          </div>
        </div>
      </div>
    </div>
  )
}
