import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'

export default async function EnseignantGestesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: procedures } = await supabase
    .from('procedures')
    .select('id, name, category_id, categories(name, color_hex)')
    .eq('is_active', true).order('name')

  const { data: residents } = await supabase
    .from('profiles').select('id, full_name').eq('role', 'resident').eq('is_active', true)

  const { data: realisations } = await supabase
    .from('realisations')
    .select('procedure_id, resident_id, status')
    .eq('status', 'validated')

  const gestesWithStats = (procedures ?? []).map(p => {
    const procReals = (realisations ?? []).filter(r => r.procedure_id === p.id)
    const residentStats = (residents ?? []).map(res => {
      const count = procReals.filter(r => r.resident_id === res.id).length
      return { ...res, count }
    }).filter(r => r.count > 0).sort((a, b) => b.count - a.count)
    return { ...p, total: procReals.length, residentStats }
  }).sort((a, b) => b.total - a.total)

  function color(count) {
    if (count === 0) return { bg: '#f1f5f9', text: '#64748b' }
    if (count < 3) return { bg: '#fef9c3', text: '#854d0e' }
    return { bg: '#dcfce7', text: '#166534' }
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader title="Suivi par geste" subtitle="Exposition des résidents aux procédures" />
      <div className="space-y-3">
        {gestesWithStats.map(p => (
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
              <span className="text-sm font-bold flex-shrink-0" style={{ color: '#0D2B4E' }}>{p.total} actes</span>
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
      </div>
    </div>
  )
}
