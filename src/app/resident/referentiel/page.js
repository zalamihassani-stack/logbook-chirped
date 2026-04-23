import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import ReferentielFilters from './ReferentielFilters'
import RefYearFilter from './RefYearFilter'
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

function GestCard({ objective, supervisionCounts, autonomyCounts }) {
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

export default async function ReferentielPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const tab = params?.tab ?? 'objectifs'

  const { data: profile } = await supabase
    .from('profiles')
    .select('residanat_start_date')
    .eq('id', user.id)
    .single()
  const residentYear = getResidentYear(profile?.residanat_start_date)

  const filterCat = params?.cat ?? ''
  const filterLevel = params?.level ?? ''
  const refYear = params?.year ? parseInt(params.year) : 1
  const refLevel = params?.level ?? ''

  const { data: validated } = await supabase
    .from('realisations')
    .select('procedure_id, participation_level, status')
    .eq('resident_id', user.id)
    .eq('status', 'validated')

  const supervisionCounts = countValidatedAtOrAboveByProcedure(validated, 3)
  const autonomyCounts = countValidatedAtOrAboveByProcedure(validated, 4)

  let myObjectives = []
  let categories = []
  if (tab === 'objectifs') {
    const [objRes, catRes] = await Promise.all([
      supabase
        .from('procedure_objectives')
        .select('procedure_id, required_level, min_count, procedures(id, name, pathologie, category_id, categories(name, color_hex))')
        .eq('year', residentYear),
      supabase.from('categories').select('id, name, color_hex').order('display_order'),
    ])
    categories = catRes.data ?? []
    myObjectives = normalizeObjectives(objRes.data).filter((objective) => {
      if (!objective.required_level) return false
      if (filterCat && objective.procedures?.category_id !== filterCat) return false
      if (filterLevel && String(objective.required_level) !== filterLevel) return false
      return true
    })
  }

  let refObjectives = []
  if (tab === 'referentiel') {
    const { data: refObjs } = await supabase
      .from('procedure_objectives')
      .select('procedure_id, required_level, min_count, procedures(id, name, pathologie, category_id, categories(name, color_hex))')
      .eq('year', refYear)
    refObjectives = normalizeObjectives(refObjs).filter((objective) => {
      if (!objective.required_level) return false
      if (refLevel && String(objective.required_level) !== refLevel) return false
      return true
    })
  }

  function tabHref(tabValue) {
    if (tabValue === 'objectifs') return '/resident/referentiel'
    return '/resident/referentiel?tab=referentiel&year=1'
  }

  return (
    <div className="max-w-3xl p-5 md:p-8">
      <PageHeader
        title="Objectifs"
        subtitle={tab === 'objectifs' ? `Annee ${residentYear} - ${myObjectives.length} geste(s)` : `Annee ${refYear} - ${refObjectives.length} geste(s)`}
      />

      <div className="mb-5 flex w-fit gap-1 rounded-xl p-1" style={{ backgroundColor: '#e2e8f0' }}>
        {[
          { value: 'objectifs', label: 'Mes objectifs' },
          { value: 'referentiel', label: 'Referentiel' },
        ].map((item) => (
          <Link
            key={item.value}
            href={tabHref(item.value)}
            className="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
            style={tab === item.value ? { backgroundColor: 'white', color: '#0D2B4E', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#64748b' }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === 'objectifs' && (
        <>
          <ReferentielFilters filterCat={filterCat} filterLevel={filterLevel} categories={categories} />
          <div className="space-y-2">
            {myObjectives.map((objective, index) => (
              <GestCard
                key={`${objective.procedure_id}-${index}`}
                objective={objective}
                supervisionCounts={supervisionCounts}
                autonomyCounts={autonomyCounts}
              />
            ))}
            {myObjectives.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucun objectif pour ces criteres</p>}
          </div>
        </>
      )}

      {tab === 'referentiel' && (
        <>
          <RefYearFilter refYear={refYear} refLevel={refLevel} />
          <div className="space-y-2">
            {refObjectives.map((objective, index) => (
              <GestCard
                key={`${objective.procedure_id}-${index}`}
                objective={objective}
                supervisionCounts={supervisionCounts}
                autonomyCounts={autonomyCounts}
              />
            ))}
            {refObjectives.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucun objectif pour cette annee</p>}
          </div>
        </>
      )}
    </div>
  )
}
