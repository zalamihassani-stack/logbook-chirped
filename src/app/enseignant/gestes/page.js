import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import GestesFilters from './GestesFilters'

export default async function EnseignantGestesPage({ searchParams }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const filterCat = params?.cat ?? ''
  const sortBy = params?.sort ?? 'count'

  const [proceduresRes, categoriesRes, residentsRes, progressRes, autonomousRes] = await Promise.all([
    supabase
      .from('procedures')
      .select('id, name, category_id, categories(id, name, color_hex)')
      .eq('is_active', true)
      .order('name'),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
    supabase.from('profiles').select('id, full_name').eq('role', 'resident').eq('is_active', true),
    supabase.from('v_resident_procedure_counts').select('resident_id, procedure_id, count_expose, count_supervise, count_autonome'),
    supabase
      .from('realisations')
      .select('procedure_id, resident_id, performed_at')
      .eq('status', 'validated')
      .eq('activity_type', 'autonome'),
  ])

  const procedures = proceduresRes.data ?? []
  const categories = categoriesRes.data ?? []
  const residents = residentsRes.data ?? []
  const progressRows = progressRes.data ?? []
  const autonomousRows = autonomousRes.data ?? []

  const filtered = filterCat ? procedures.filter((procedure) => procedure.category_id === filterCat) : procedures

  const gestesWithStats = filtered.map((procedure) => {
    const procRows = progressRows.filter((row) => row.procedure_id === procedure.id)
    const residentStats = residents
      .map((resident) => {
        const row = procRows.find((item) => item.resident_id === resident.id)
        const count = row?.count_expose ?? 0
        return { ...resident, count }
      })
      .filter((resident) => resident.count > 0)
      .sort((a, b) => b.count - a.count)

    const autonomeReals = autonomousRows.filter((row) => row.procedure_id === procedure.id)
    const lastAutonomeYear = autonomeReals.length
      ? Math.max(...autonomeReals.map((row) => new Date(row.performed_at).getFullYear()))
      : null

    const total = procRows.reduce((sum, row) => sum + (row.count_expose ?? 0), 0)
    return { ...procedure, total, residentStats, lastAutonomeYear }
  })

  const sorted = [...gestesWithStats].sort((a, b) => {
    if (sortBy === 'alpha') return a.name.localeCompare(b.name, 'fr')
    if (sortBy === 'autonome') {
      if (a.lastAutonomeYear === b.lastAutonomeYear) return b.total - a.total
      if (a.lastAutonomeYear === null) return 1
      if (b.lastAutonomeYear === null) return -1
      return b.lastAutonomeYear - a.lastAutonomeYear
    }
    return b.total - a.total
  })

  function color(count) {
    if (count === 0) return { bg: '#f1f5f9', text: '#64748b' }
    if (count < 3) return { bg: '#fef9c3', text: '#854d0e' }
    return { bg: '#dcfce7', text: '#166534' }
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader title="Suivi par geste" subtitle="Exposition des residents aux procedures" />

      <GestesFilters filterCat={filterCat} sortBy={sortBy} categories={categories} />

      <div className="space-y-3">
        {sorted.map((procedure) => (
          <div key={procedure.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{procedure.name}</p>
                {procedure.categories && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                    style={{ backgroundColor: `${procedure.categories.color_hex}25`, color: procedure.categories.color_hex }}>
                    {procedure.categories.name}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-sm font-bold" style={{ color: '#0D2B4E' }}>{procedure.total} expositions</span>
                {procedure.lastAutonomeYear && (
                  <span className="text-xs text-slate-400">Autonome : {procedure.lastAutonomeYear}</span>
                )}
              </div>
            </div>
            {procedure.residentStats.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {procedure.residentStats.map((resident) => {
                  const tag = color(resident.count)
                  return (
                    <span key={resident.id} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: tag.bg, color: tag.text }}>
                      {resident.full_name.split(' ')[0]} ×{resident.count}
                    </span>
                  )
                })}
              </div>
            )}
            {procedure.residentStats.length === 0 && <p className="text-xs text-slate-400 mt-1">Aucune realisation validee</p>}
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Aucun geste pour cette specialite</p>
        )}
      </div>
    </div>
  )
}
