import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MetricCard from '@/components/ui/MetricCard'
import PageHeader from '@/components/ui/PageHeader'
import { getResidentYear } from '@/lib/utils'
import { CheckCircle, Clock, FileText, XCircle } from 'lucide-react'

export default async function ResidentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('residanat_start_date').eq('id', user.id).single()

  const year = getResidentYear(profile?.residanat_start_date)

  const [realsRes, objectivesRes, categoriesRes] = await Promise.all([
    supabase.from('realisations').select('id, status, procedure_id, procedures(category_id)').eq('resident_id', user.id),
    supabase.from('procedure_objectives').select('procedure_id, min_count, procedures(category_id)').eq('year', year),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
  ])

  const reals = realsRes.data ?? []
  const objectives = objectivesRes.data ?? []
  const categories = categoriesRes.data ?? []

  const validated = reals.filter(r => r.status === 'validated')
  const stats = {
    validated: validated.length,
    pending: reals.filter(r => r.status === 'pending').length,
    total: reals.length,
    refused: reals.filter(r => r.status === 'refused').length,
  }

  const totalRequired = objectives.reduce((s, o) => s + o.min_count, 0)
  const progressPct = totalRequired ? Math.min(100, Math.round((stats.validated / totalRequired) * 100)) : 0

  // Progression par catégorie
  const catProgress = categories.map(cat => {
    const catObjs = objectives.filter(o => o.procedures?.category_id === cat.id)
    const required = catObjs.reduce((s, o) => s + o.min_count, 0)
    const done = validated.filter(r => r.procedures?.category_id === cat.id).length
    return { ...cat, required, done }
  }).filter(c => c.required > 0)

  const metrics = [
    { label: 'Actes validés', value: stats.validated, icon: CheckCircle, iconBg: '#dcfce7', iconColor: '#166534' },
    { label: 'En attente', value: stats.pending, icon: Clock, iconBg: '#fef9c3', iconColor: '#854d0e' },
    { label: 'Total actes', value: stats.total, icon: FileText, iconBg: '#E8F4FC', iconColor: '#0D2B4E' },
    { label: 'Refusés', value: stats.refused, icon: XCircle, iconBg: '#fee2e2', iconColor: '#991b1b' },
  ]

  return (
    <div className="p-5 md:p-8 max-w-4xl">
      <PageHeader title="Mon tableau de bord" subtitle={`Année ${year} de résidanat`} />

      <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-4">
        {metrics.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* Progression annuelle */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold" style={{ color: '#0D2B4E' }}>Progression annuelle</span>
          <span className="text-slate-500">{stats.validated} / {totalRequired} actes requis</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: '#0D2B4E' }} />
        </div>
        <p className="text-xs text-slate-500 mt-1.5 text-right">{progressPct}%</p>
      </div>

      {/* Progression par catégorie */}
      {catProgress.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="font-semibold text-sm mb-4" style={{ color: '#0D2B4E' }}>Par catégorie</p>
          <div className="space-y-3">
            {catProgress.map(c => {
              const pct = c.required ? Math.min(100, Math.round((c.done / c.required) * 100)) : 0
              return (
                <div key={c.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium" style={{ color: c.color_hex }}>{c.name}</span>
                    <span className="text-slate-500">{c.done}/{c.required}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color_hex }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
