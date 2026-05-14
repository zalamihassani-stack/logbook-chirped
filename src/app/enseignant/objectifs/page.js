import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import ObjectifsFilters from './ObjectifsFilters'

const SECTIONS = [
  { level: 3, label: 'Maitrise', dot: '#16a34a', style: { bg: 'var(--color-success-light)', color: 'var(--color-success)' } },
  { level: 2, label: 'Competence supervisee', dot: '#f59e0b', style: { bg: '#fef3c7', color: '#92400e' } },
  { level: 1, label: 'Exposition', dot: '#3b82f6', style: { bg: 'var(--color-info-light)', color: 'var(--color-info)' } },
]

export default async function ObjectifsPage({ searchParams }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const year = params?.year ? parseInt(params.year, 10) : 1
  const filterCat = params?.cat ?? ''
  const filterLevel = params?.level ?? ''

  const [{ data: allObjectives }, { data: categories }] = await Promise.all([
    supabase
      .from('procedure_objectives')
      .select('year, required_level, min_count, procedures(id, name, pathologie, category_id, categories(name, color_hex))')
      .eq('is_active', true),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
  ])

  const all = allObjectives ?? []
  const firstYearAtLevel = new Map()
  for (const objective of all) {
    const procedureId = objective.procedures?.id
    if (!procedureId) continue
    const key = `${procedureId}_${objective.required_level}`
    const current = firstYearAtLevel.get(key)
    if (current === undefined || objective.year < current) firstYearAtLevel.set(key, objective.year)
  }

  const yearObjectives = all.filter((objective) => {
    if (objective.year !== year) return false
    const procedureId = objective.procedures?.id
    if (!procedureId) return false
    if (firstYearAtLevel.get(`${procedureId}_${objective.required_level}`) !== year) return false
    if (filterCat && objective.procedures?.category_id !== filterCat) return false
    if (filterLevel && String(objective.required_level) !== filterLevel) return false
    return true
  })

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader
        title="Objectifs de formation"
        subtitle={`${yearObjectives.length} geste(s) introduits en annee ${year}`}
      />

      <ObjectifsFilters
        year={year}
        filterCat={filterCat}
        filterLevel={filterLevel}
        categories={categories ?? []}
      />

      {SECTIONS.map(({ level, label, dot, style }) => {
        const items = yearObjectives.filter((objective) => objective.required_level === level)
        if (items.length === 0) return null
        return (
          <section key={level} className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
              <h2 className="text-sm font-semibold" style={{ color: style.color }}>
                {label}
                <span className="ml-2 text-xs font-normal text-slate-400">({items.length})</span>
              </h2>
            </div>
            <div className="space-y-2">
              {items.map((objective, index) => {
                const procedure = objective.procedures
                const category = procedure?.categories
                return (
                  <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{procedure?.name ?? '—'}</p>
                        {procedure?.pathologie && <p className="text-xs text-slate-500 mt-0.5">{procedure.pathologie}</p>}
                        {category && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                            style={{ backgroundColor: `${category.color_hex}25`, color: category.color_hex }}>
                            {category.name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ backgroundColor: style.bg, color: style.color }}>
                        min. {objective.min_count}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {yearObjectives.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-8">Aucun objectif pour ces criteres</p>
      )}
    </div>
  )
}
