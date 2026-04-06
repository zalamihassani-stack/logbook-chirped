import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import ReferentielFilters from './ReferentielFilters'
import { getResidentYear } from '@/lib/utils'

const LEVELS = { 1: 'Observation', 2: 'Aide opératoire', 3: 'Sous supervision', 4: 'Autonome' }
const LEVEL_STYLE = {
  1: { bg: '#dbeafe', color: '#1e40af' },
  2: { bg: '#fef9c3', color: '#854d0e' },
  3: { bg: '#ffedd5', color: '#9a3412' },
  4: { bg: '#dcfce7', color: '#166534' },
}

export default async function ReferentielPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const filterCat = params?.cat ?? ''
  const filterLevel = params?.level ?? ''

  const { data: profile } = await supabase
    .from('profiles').select('residanat_start_date').eq('id', user.id).single()
  const year = getResidentYear(profile?.residanat_start_date)

  const [{ data: objectives }, { data: categories }, { data: validated }] = await Promise.all([
    supabase
      .from('procedure_objectives')
      .select('procedure_id, required_level, min_count, procedures(id, name, pathologie, category_id, categories(name, color_hex))')
      .eq('year', year),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
    supabase.from('realisations').select('procedure_id').eq('resident_id', user.id).eq('status', 'validated'),
  ])

  const validatedCounts = {}
  ;(validated ?? []).forEach(r => {
    validatedCounts[r.procedure_id] = (validatedCounts[r.procedure_id] ?? 0) + 1
  })

  const filtered = (objectives ?? []).filter(o => {
    if (filterCat && o.procedures?.category_id !== filterCat) return false
    if (filterLevel && String(o.required_level) !== filterLevel) return false
    return true
  })

  function progressBadge(done, required) {
    if (done >= required) return { bg: '#dcfce7', color: '#166534', text: `✓ ${done}/${required}` }
    if (done > 0)          return { bg: '#fef9c3', color: '#854d0e', text: `${done}/${required}` }
    return                        { bg: '#f1f5f9', color: '#64748b', text: `0/${required}` }
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader
        title="Objectifs"
        subtitle={`Année ${year} — ${filtered.length} geste(s)`}
      />

      <ReferentielFilters
        filterCat={filterCat}
        filterLevel={filterLevel}
        categories={categories ?? []}
      />

      <div className="space-y-2">
        {filtered.map((o, i) => {
          const p = o.procedures
          const cat = p?.categories
          const done = validatedCounts[o.procedure_id] ?? 0
          const prog = progressBadge(done, o.min_count)
          const ls = LEVEL_STYLE[o.required_level]
          return (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{p?.name ?? '—'}</p>
                  {p?.pathologie && <p className="text-xs text-slate-500 mt-0.5">{p.pathologie}</p>}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {cat && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: cat.color_hex + '25', color: cat.color_hex }}>
                        {cat.name}
                      </span>
                    )}
                    {ls && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: ls.bg, color: ls.color }}>
                        {LEVELS[o.required_level]}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                  style={{ backgroundColor: prog.bg, color: prog.color }}>
                  {prog.text}
                </span>
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
