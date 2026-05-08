import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import ReferentielFilters from './ReferentielFilters'
import { OBJECTIF_LEVEL_LABELS, getResidentProgressRows, indexProgressByProcedure, getCountForRequiredLevel, procedureToGlobalObjective } from '@/lib/logbook'

const LEVEL_STYLE = {
  1: { bg: '#dbeafe', color: '#1e40af' },
  2: { bg: '#fef9c3', color: '#854d0e' },
  3: { bg: '#dcfce7', color: '#166534' },
}

function progressBadge(done, required) {
  if (done >= required) return { bg: '#dcfce7', color: '#166534', text: `OK ${done}/${required}` }
  if (done > 0) return { bg: '#fef9c3', color: '#854d0e', text: `${done}/${required}` }
  return { bg: '#f1f5f9', color: '#64748b', text: `0/${required}` }
}

function RequirementLine({ label, value }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      {label}: {value}
    </span>
  )
}

function GestCard({ objective, progressIndex }) {
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
          <div className="mt-2 flex flex-wrap gap-1.5">
            <RequirementLine label="Exposition" value={procedure?.seuil_exposition_min ?? 0} />
            <RequirementLine label="Supervision" value={procedure?.seuil_supervision_min ?? 0} />
            <RequirementLine label="Autonomie" value={procedure?.seuil_autonomie_min ?? 0} />
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const filterCat = params?.cat ?? ''
  const filterLevel = params?.level ?? ''

  const [progressRows, categoriesRes, proceduresRes] = await Promise.all([
    getResidentProgressRows(supabase, user.id),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
    supabase
      .from('procedures')
      .select('id, name, pathologie, category_id, objectif_final, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, categories(name, color_hex)')
      .eq('is_active', true)
      .order('name'),
  ])

  const progressIndex = indexProgressByProcedure(progressRows)
  const categories = categoriesRes.data ?? []
  const objectives = (proceduresRes.data ?? [])
    .map(procedureToGlobalObjective)
    .filter((objective) => {
      if (!objective.required_level) return false
      if (filterCat && objective.procedures?.category_id !== filterCat) return false
      if (filterLevel && String(objective.required_level) !== filterLevel) return false
      return true
    })

  return (
    <div className="max-w-3xl p-5 md:p-8">
      <PageHeader title="Référentiel" subtitle={`${objectives.length} geste(s) actifs`} />

      <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
        Les exigences minimales sont affichées sur chaque geste. La progression personnelle détaillée se trouve dans l&apos;onglet Progression.
      </div>

      <ReferentielFilters filterCat={filterCat} filterLevel={filterLevel} categories={categories} showAllLevels />

      <div className="space-y-2">
        {objectives.map((objective) => (
          <GestCard key={objective.procedure_id} objective={objective} progressIndex={progressIndex} />
        ))}
        {objectives.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucun geste pour ces critères</p>}
      </div>
    </div>
  )
}
