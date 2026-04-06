import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import ObjectifsFilters from './ObjectifsFilters'

const LEVELS = { 1: 'Observation', 2: 'Aide opératoire', 3: 'Sous supervision', 4: 'Autonome' }
const LEVEL_STYLE = {
  1: { bg: '#dbeafe', color: '#1e40af' },
  2: { bg: '#fef9c3', color: '#854d0e' },
  3: { bg: '#ffedd5', color: '#9a3412' },
  4: { bg: '#dcfce7', color: '#166534' },
}

export default async function ObjectifsPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const year = parseInt(params?.year ?? '1')
  const filterCat = params?.cat ?? ''
  const filterLevel = params?.level ?? ''

  const [{ data: objectives }, { data: categories }] = await Promise.all([
    supabase
      .from('procedure_objectives')
      .select('year, required_level, min_count, procedures(id, name, pathologie, category_id, categories(name, color_hex))')
      .eq('year', year),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
  ])

  const filtered = (objectives ?? []).filter(o => {
    if (filterCat && o.procedures?.category_id !== filterCat) return false
    if (filterLevel && String(o.required_level) !== filterLevel) return false
    return true
  })

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader
        title="Objectifs de formation"
        subtitle={`${filtered.length} geste(s) — Année ${year}`}
      />

      <ObjectifsFilters
        year={year}
        filterCat={filterCat}
        filterLevel={filterLevel}
        categories={categories ?? []}
      />

      <div className="space-y-2">
        {filtered.map((o, i) => {
          const p = o.procedures
          const cat = p?.categories
          const ls = LEVEL_STYLE[o.required_level]
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
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {ls && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: ls.bg, color: ls.color }}>
                      {LEVELS[o.required_level]}
                    </span>
                  )}
                  <p className="text-xs text-slate-400">min. {o.min_count}</p>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Aucun objectif pour ces critères</p>
        )}
      </div>
    </div>
  )
}
