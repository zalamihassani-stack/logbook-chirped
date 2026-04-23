import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import ReferentielFilters from '../referentiel/ReferentielFilters'
import {
  getResidentYear,
  PARTICIPATION_LEVELS,
  normalizeObjectives,
  countValidatedAtOrAboveByProcedure,
} from '@/lib/utils'

const LEVEL_STYLE = {
  1: { bg: '#dbeafe', color: '#1e40af' },
  2: { bg: '#fef9c3', color: '#854d0e' },
  3: { bg: '#ffedd5', color: '#9a3412' },
  4: { bg: '#dcfce7', color: '#166534' },
}

function progressBadge(done, required) {
  if (done >= required) return { bg: '#dcfce7', color: '#166534', text: `OK ${done}/${required}` }
  if (done > 0) return { bg: '#fef9c3', color: '#854d0e', text: `${done}/${required}` }
  return { bg: '#f1f5f9', color: '#64748b', text: `0/${required}` }
}

function getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts) {
  const counts = objective.required_level >= 4 ? autonomyCounts : supervisionCounts
  return counts[objective.procedure_id] ?? 0
}

function ObjectiveCard({ objective, supervisionCounts, autonomyCounts }) {
  const procedure = objective.procedures
  const category = procedure?.categories
  const done = getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts)
  const progress = progressBadge(done, objective.min_count)
  const levelStyle = LEVEL_STYLE[objective.required_level]

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{procedure?.name ?? '-'}</p>
          {procedure?.pathologie && <p className="mt-0.5 text-xs text-slate-500">{procedure.pathologie}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {category && (
              <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${category.color_hex}25`, color: category.color_hex }}>
                {category.name}
              </span>
            )}
            {levelStyle && (
              <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: levelStyle.bg, color: levelStyle.color }}>
                {PARTICIPATION_LEVELS[objective.required_level]}
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const filterCat = params?.cat ?? ''
  const filterLevel = params?.level ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('residanat_start_date')
    .eq('id', user.id)
    .single()
  const residentYear = getResidentYear(profile?.residanat_start_date)

  const [objectivesRes, categoriesRes, validatedRes] = await Promise.all([
    supabase
      .from('procedure_objectives')
      .select('procedure_id, required_level, min_count, procedures(id, name, pathologie, category_id, categories(name, color_hex))')
      .eq('year', residentYear),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
    supabase
      .from('realisations')
      .select('procedure_id, participation_level, status')
      .eq('resident_id', user.id)
      .eq('status', 'validated'),
  ])

  const categories = categoriesRes.data ?? []
  const objectives = normalizeObjectives(objectivesRes.data).filter((objective) => {
    if (!objective.required_level) return false
    if (filterCat && objective.procedures?.category_id !== filterCat) return false
    if (filterLevel && String(objective.required_level) !== filterLevel) return false
    return true
  })

  const supervisionCounts = countValidatedAtOrAboveByProcedure(validatedRes.data, 3)
  const autonomyCounts = countValidatedAtOrAboveByProcedure(validatedRes.data, 4)

  const completed = objectives.filter((objective) => {
    const done = getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts)
    return done >= objective.min_count
  }).length
  const total = objectives.length
  const progressPct = total ? Math.round((completed / total) * 100) : 0
  const pendingObjectives = objectives.filter((objective) => {
    const done = getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts)
    return done < objective.min_count
  })

  return (
    <div className="max-w-3xl p-5 md:p-8">
      <PageHeader title="Progression" subtitle={`Annee ${residentYear} - ${completed}/${total} objectif(s) atteints`} />

      <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold" style={{ color: '#0D2B4E' }}>Vue d&apos;ensemble</span>
          <span className="text-slate-500">{progressPct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: progressPct >= 80 ? '#166534' : progressPct >= 50 ? '#0D2B4E' : '#854d0e' }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>{completed} geste(s) valides au niveau attendu</span>
          <Link href="/resident/referentiel?tab=referentiel&year=1" className="font-medium" style={{ color: '#7BB8E8' }}>
            Voir le referentiel complet
          </Link>
        </div>
      </div>

      <ReferentielFilters filterCat={filterCat} filterLevel={filterLevel} categories={categories} basePath="/resident/progression" />

      {pendingObjectives.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {pendingObjectives.length} objectif(s) restent a completer cette annee.
        </div>
      )}

      <div className="space-y-2">
        {objectives.map((objective, index) => (
          <ObjectiveCard
            key={`${objective.procedure_id}-${index}`}
            objective={objective}
            supervisionCounts={supervisionCounts}
            autonomyCounts={autonomyCounts}
          />
        ))}
        {objectives.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucun objectif pour ces criteres</p>}
      </div>
    </div>
  )
}
