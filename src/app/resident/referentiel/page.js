import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import ReferentielFilters from './ReferentielFilters'
import { OBJECTIF_LEVEL_LABELS, procedureToGlobalObjective } from '@/lib/logbook'

const LEVEL_STYLE = {
  1: { bg: 'var(--color-info-light)', color: 'var(--color-info)' },
  2: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  3: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function RequirementLine({ children }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
      {children}
    </span>
  )
}

function GestCard({ objective, showLevel = true }) {
  const procedure = objective.procedures
  const category = procedure?.categories
  const levelStyle = LEVEL_STYLE[objective.required_level]

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug text-slate-800">{procedure?.name ?? '-'}</p>
        {procedure?.pathologie && <p className="mt-0.5 text-xs text-slate-500">{procedure.pathologie}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {showLevel && levelStyle && (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: levelStyle.bg, color: levelStyle.color }}>
              {OBJECTIF_LEVEL_LABELS[objective.required_level]}
            </span>
          )}
          <RequirementLine>{objective.min_count} acte{objective.min_count > 1 ? 's' : ''}</RequirementLine>
          <RequirementLine>A{objective.year}</RequirementLine>
          {category && (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: `${category.color_hex}20`, color: category.color_hex }}>
              {category.name}
            </span>
          )}
        </div>
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
  const query = typeof params?.q === 'string' ? params.q.trim() : ''
  const filterCat = params?.cat ?? ''
  const filterLevel = params?.level ?? ''
  const filterYear = params?.year ?? ''
  const normalizedQuery = normalizeText(query)

  const [categoriesRes, proceduresRes] = await Promise.all([
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
    supabase
      .from('procedures')
      .select('id, name, pathologie, category_id, objectif_final, target_level, target_count, target_year, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, categories(name, color_hex)')
      .eq('is_active', true)
      .order('name'),
  ])

  const categories = categoriesRes.data ?? []
  const objectives = (proceduresRes.data ?? [])
    .map(procedureToGlobalObjective)
    .filter((objective) => {
      if (!objective.required_level) return false
      const procedure = objective.procedures
      const category = procedure?.categories
      if (filterCat && procedure?.category_id !== filterCat) return false
      if (filterLevel && String(objective.required_level) !== filterLevel) return false
      if (filterYear && String(objective.year) !== filterYear) return false
      if (normalizedQuery) {
        const haystack = normalizeText(`${procedure?.name ?? ''} ${procedure?.pathologie ?? ''} ${category?.name ?? ''}`)
        if (!haystack.includes(normalizedQuery)) return false
      }
      return true
    })

  return (
    <div className="max-w-3xl p-5 md:p-8">
      <PageHeader title="Referentiel" subtitle={`${objectives.length} geste(s)`} />

      <ReferentielFilters
        query={query}
        filterCat={filterCat}
        filterLevel={filterLevel}
        filterYear={filterYear}
        categories={categories}
      />

      <div className="space-y-2">
        {objectives.map((objective) => (
          <GestCard key={objective.procedure_id} objective={objective} showLevel={!filterLevel} />
        ))}
        {objectives.length === 0 && <p className="rounded-2xl bg-white py-8 text-center text-sm text-slate-400">Aucun geste</p>}
      </div>
    </div>
  )
}
