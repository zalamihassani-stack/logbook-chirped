import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import ReferentielFilters from '../referentiel/ReferentielFilters'
import { getResidentYear } from '@/lib/utils'
import { OBJECTIF_LEVEL_LABELS, getResidentProgressRows, indexProgressByProcedure, getCountForRequiredLevel, procedureToGlobalObjective } from '@/lib/logbook'

const LEVEL_STYLE = {
  1: { bg: 'var(--color-info-light)', color: 'var(--color-info)' },
  2: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  3: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
}

function progressBadge(done, required) {
  if (done >= required) return { bg: 'var(--color-success-light)', color: 'var(--color-success)', text: `OK ${done}/${required}` }
  if (done > 0) return { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', text: `${done}/${required}` }
  return { bg: '#f1f5f9', color: '#64748b', text: `0/${required}` }
}

function ObjectiveCard({ objective, progressIndex, showYear }) {
  const procedure = objective.procedures
  const category = procedure?.categories
  const done = getCountForRequiredLevel(progressIndex[objective.procedure_id], objective.required_level)
  const progress = progressBadge(done, objective.min_count)
  const levelStyle = LEVEL_STYLE[objective.required_level]

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{procedure?.name ?? '-'}</p>
          {procedure?.pathologie && <p className="mt-0.5 text-xs text-slate-500">{procedure.pathologie}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {showYear && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">A{objective.year}</span>}
            {category && (
              <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${category.color_hex}25`, color: category.color_hex }}>
                {category.name}
              </span>
            )}
            {levelStyle && (
              <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: levelStyle.bg, color: levelStyle.color }}>
                {OBJECTIF_LEVEL_LABELS[objective.required_level]}
              </span>
            )}
          </div>
        </div>
        <span className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: progress.bg, color: progress.color }}>
          {progress.text}
        </span>
      </div>
    </div>
  )
}

export default async function ProgressionPage({ searchParams }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const scope = params?.scope === 'formation' ? 'formation' : 'annee'
  const filterCat = params?.cat ?? ''
  const filterLevel = params?.level ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('residanat_start_date')
    .eq('id', user.id)
    .single()
  const residentYear = getResidentYear(profile?.residanat_start_date)

  const [progressRows, objectivesRes, proceduresRes, categoriesRes] = await Promise.all([
    getResidentProgressRows(supabase, user.id),
    supabase
      .from('procedure_objectives')
      .select('procedure_id, year, required_level, min_count, procedures(id, name, pathologie, category_id, categories(name, color_hex))')
      .eq('is_active', true),
    supabase
      .from('procedures')
      .select('id, name, pathologie, category_id, objectif_final, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, categories(name, color_hex)')
      .eq('is_active', true),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
  ])

  const categories = categoriesRes.data ?? []
  const progressIndex = indexProgressByProcedure(progressRows)
  const sourceObjectives = scope === 'formation'
    ? (proceduresRes.data ?? []).map(procedureToGlobalObjective)
    : (objectivesRes.data ?? [])

  const objectives = sourceObjectives.filter((objective) => {
    if (!objective.required_level) return false
    if (scope === 'annee' && objective.year !== residentYear) return false
    if (filterCat && objective.procedures?.category_id !== filterCat) return false
    if (filterLevel && String(objective.required_level) !== filterLevel) return false
    return true
  })

  const completed = objectives.filter((objective) => {
    const count = getCountForRequiredLevel(progressIndex[objective.procedure_id], objective.required_level)
    return count >= objective.min_count
  }).length
  const total = objectives.length
  const progressPct = total ? Math.round((completed / total) * 100) : 0
  const pendingObjectives = objectives.filter((objective) => {
    const count = getCountForRequiredLevel(progressIndex[objective.procedure_id], objective.required_level)
    return count < objective.min_count
  })

  const basePath = scope === 'formation' ? '/resident/progression?scope=formation' : '/resident/progression'

  return (
    <div className="max-w-3xl p-5 md:p-8">
      <PageHeader
        title="Progression"
        subtitle={scope === 'formation' ? `${completed}/${total} geste(s) au niveau attendu` : `Année ${residentYear} - ${completed}/${total} objectif(s) atteints`}
      />

      <div className="mb-5 flex gap-2 rounded-xl bg-slate-100 p-1">
        <Link
          href="/resident/progression"
          className="flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition"
          style={scope === 'annee' ? { backgroundColor: 'var(--color-navy)', color: 'white' } : { color: '#64748b' }}
        >
          Année en cours
        </Link>
        <Link
          href="/resident/progression?scope=formation"
          className="flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition"
          style={scope === 'formation' ? { backgroundColor: 'var(--color-navy)', color: 'white' } : { color: '#64748b' }}
        >
          Progression globale
        </Link>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold" style={{ color: 'var(--color-navy)' }}>Vue d&apos;ensemble</span>
          <span className="text-slate-500">{progressPct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: progressPct >= 80 ? 'var(--color-success)' : progressPct >= 50 ? 'var(--color-navy)' : 'var(--color-warning)' }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>{completed} objectif(s) validé(s) au niveau attendu</span>
          <Link href="/resident/referentiel?tab=referentiel&year=1" className="font-medium" style={{ color: 'var(--color-sky)' }}>
            Voir le référentiel complet
          </Link>
        </div>
      </div>

      <ReferentielFilters filterCat={filterCat} filterLevel={filterLevel} categories={categories} basePath={basePath} showAllLevels={scope === 'formation'} />

      {pendingObjectives.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {pendingObjectives.length} objectif(s) restent à compléter {scope === 'annee' ? 'cette année' : 'dans cette vue'}.
        </div>
      )}

      <div className="space-y-2">
        {objectives.map((objective, index) => (
          <ObjectiveCard key={`${objective.procedure_id}-${objective.year ?? 'global'}-${objective.required_level}-${index}`} objective={objective} progressIndex={progressIndex} showYear={false} />
        ))}
        {objectives.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucun objectif pour ces critères</p>}
      </div>
    </div>
  )
}
