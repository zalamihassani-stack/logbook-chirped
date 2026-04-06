import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import ObjectifsFilters from './ObjectifsFilters'

const SECTIONS = [
  { level: 4, label: 'Autonome',         dot: '#16a34a', style: { bg: '#dcfce7', color: '#166534' } },
  { level: 3, label: 'Sous supervision',  dot: '#ea580c', style: { bg: '#ffedd5', color: '#9a3412' } },
  { level: 2, label: 'Aide opératoire',   dot: '#3b82f6', style: { bg: '#dbeafe', color: '#1e40af' } },
  { level: 1, label: 'Observation',       dot: '#94a3b8', style: { bg: '#f1f5f9', color: '#475569' } },
]

export default async function ObjectifsPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const year = parseInt(params?.year ?? '1')
  const filterCat = params?.cat ?? ''
  const filterLevel = params?.level ?? ''

  const [{ data: allObjectives }, { data: categories }] = await Promise.all([
    supabase
      .from('procedure_objectives')
      .select('year, required_level, min_count, procedures(id, name, pathologie, category_id, categories(name, color_hex))'),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
  ])

  const all = allObjectives ?? []

  // Pour chaque (procedure, level), trouver la première année où ce niveau apparaît
  // Un geste s'affiche en année N au niveau L seulement si c'est la première fois
  // qu'il atteint ce niveau (pas de (procedure, level) identique dans une année < N)
  const firstYearAtLevel = new Map() // clé = "procedureId_level"
  for (const o of all) {
    const pid = o.procedures?.id
    if (!pid) continue
    const key = `${pid}_${o.required_level}`
    const current = firstYearAtLevel.get(key)
    if (current === undefined || o.year < current) {
      firstYearAtLevel.set(key, o.year)
    }
  }

  // Objectifs de l'année sélectionnée : gestes qui atteignent ce niveau pour la 1ère fois
  const yearObjectives = all.filter(o => {
    if (o.year !== year) return false
    const pid = o.procedures?.id
    if (!pid) return false
    const key = `${pid}_${o.required_level}`
    if (firstYearAtLevel.get(key) !== year) return false
    if (filterCat && o.procedures?.category_id !== filterCat) return false
    if (filterLevel && String(o.required_level) !== filterLevel) return false
    return true
  })

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader
        title="Objectifs de formation"
        subtitle={`${yearObjectives.length} geste(s) — Année ${year}`}
      />

      <ObjectifsFilters
        year={year}
        filterCat={filterCat}
        filterLevel={filterLevel}
        categories={categories ?? []}
      />

      {SECTIONS.map(({ level, label, dot, style }) => {
        const items = yearObjectives.filter(o => o.required_level === level)
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
              {items.map((o, i) => {
                const p = o.procedures
                const cat = p?.categories
                return (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{p?.name ?? '—'}</p>
                        {p?.pathologie && <p className="text-xs text-slate-500 mt-0.5">{p.pathologie}</p>}
                        {cat && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                            style={{ backgroundColor: cat.color_hex + '25', color: cat.color_hex }}>
                            {cat.name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ backgroundColor: style.bg, color: style.color }}>
                        min. {o.min_count}
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
        <p className="text-center text-sm text-slate-400 py-8">Aucun objectif pour ces critères</p>
      )}
    </div>
  )
}
