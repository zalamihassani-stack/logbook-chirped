import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import GestesFilters from './GestesFilters'

export default async function EnseignantGestesPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const filterCat = params?.cat ?? ''
  const sortBy = params?.sort ?? 'count'

  const { data: procedures } = await supabase
    .from('procedures')
    .select('id, name, category_id, categories(id, name, color_hex)')
    .eq('is_active', true).order('name')

  const { data: categories } = await supabase
    .from('categories').select('id, name, color_hex').order('display_order')

  const { data: residents } = await supabase
    .from('profiles').select('id, full_name').eq('role', 'resident').eq('is_active', true)

  const { data: realisations } = await supabase
    .from('realisations')
    .select('procedure_id, resident_id, status, participation_level, performed_at')
    .eq('status', 'validated')

  // Filtrer par spécialité
  const filtered = filterCat
    ? (procedures ?? []).filter(p => p.category_id === filterCat)
    : (procedures ?? [])

  const gestesWithStats = filtered.map(p => {
    const procReals = (realisations ?? []).filter(r => r.procedure_id === p.id)
    const residentStats = (residents ?? []).map(res => {
      const count = procReals.filter(r => r.resident_id === res.id).length
      return { ...res, count }
    }).filter(r => r.count > 0).sort((a, b) => b.count - a.count)

    // Année la plus récente de réalisation en autonome (participation_level = 4)
    const autonomeReals = procReals.filter(r => r.participation_level === 4)
    const lastAutonomeYear = autonomeReals.length
      ? Math.max(...autonomeReals.map(r => new Date(r.performed_at).getFullYear()))
      : null

    return { ...p, total: procReals.length, residentStats, lastAutonomeYear }
  })

  // Tri
  const sorted = [...gestesWithStats].sort((a, b) => {
    if (sortBy === 'alpha') return a.name.localeCompare(b.name, 'fr')
    if (sortBy === 'autonome') {
      if (a.lastAutonomeYear === b.lastAutonomeYear) return b.total - a.total
      if (a.lastAutonomeYear === null) return 1
      if (b.lastAutonomeYear === null) return -1
      return b.lastAutonomeYear - a.lastAutonomeYear
    }
    // count (défaut)
    return b.total - a.total
  })

  function color(count) {
    if (count === 0) return { bg: '#f1f5f9', text: '#64748b' }
    if (count < 3) return { bg: '#fef9c3', text: '#854d0e' }
    return { bg: '#dcfce7', text: '#166534' }
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader title="Suivi par geste" subtitle="Exposition des résidents aux procédures" />

      <GestesFilters
        filterCat={filterCat}
        sortBy={sortBy}
        categories={categories ?? []}
      />

      <div className="space-y-3">
        {sorted.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                {p.categories && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                    style={{ backgroundColor: p.categories.color_hex + '25', color: p.categories.color_hex }}>
                    {p.categories.name}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-sm font-bold" style={{ color: '#0D2B4E' }}>{p.total} actes</span>
                {p.lastAutonomeYear && (
                  <span className="text-xs text-slate-400">Autonome : {p.lastAutonomeYear}</span>
                )}
              </div>
            </div>
            {p.residentStats.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {p.residentStats.map(r => {
                  const c = color(r.count)
                  return (
                    <span key={r.id} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: c.bg, color: c.text }}>
                      {r.full_name.split(' ')[0]} ×{r.count}
                    </span>
                  )
                })}
              </div>
            )}
            {p.residentStats.length === 0 && <p className="text-xs text-slate-400 mt-1">Aucune réalisation validée</p>}
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Aucun geste pour cette spécialité</p>
        )}
      </div>
    </div>
  )
}
