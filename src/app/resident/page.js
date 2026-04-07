import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MetricCard from '@/components/ui/MetricCard'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDate, getResidentYear, PARTICIPATION_LEVELS } from '@/lib/utils'
import { CheckCircle, Clock, FileText, XCircle, ChevronRight, AlertCircle } from 'lucide-react'

export default async function ResidentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('residanat_start_date, full_name').eq('id', user.id).single()

  const year = getResidentYear(profile?.residanat_start_date)

  const [realsRes, objectivesRes, categoriesRes, pendingRealsRes] = await Promise.all([
    supabase.from('realisations').select('id, status, procedure_id, procedures(category_id, id)').eq('resident_id', user.id),
    supabase.from('procedure_objectives')
      .select('procedure_id, min_count, required_level, procedures(id, name, category_id, categories(name, color_hex))')
      .eq('year', year),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
    supabase.from('realisations')
      .select('id, performed_at, participation_level, status, procedures(name)')
      .eq('resident_id', user.id).eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(5),
  ])

  const reals = realsRes.data ?? []
  const objectives = objectivesRes.data ?? []
  const categories = categoriesRes.data ?? []
  const pendingReals = pendingRealsRes.data ?? []

  const validated = reals.filter(r => r.status === 'validated')
  const stats = {
    validated: validated.length,
    pending: reals.filter(r => r.status === 'pending').length,
    total: reals.length,
    refused: reals.filter(r => r.status === 'refused').length,
  }

  // Seuls les objectifs supervision (3) ou autonome (4) de l'année, min_count = 1
  const activeObjectives = objectives.filter(o => o.required_level >= 3)
  const totalRequired = activeObjectives.length  // min 1 par geste
  const doneCount = activeObjectives.filter(obj =>
    validated.some(r => r.procedures?.id === obj.procedure_id)
  ).length
  const progressPct = totalRequired ? Math.min(100, Math.round((doneCount / totalRequired) * 100)) : 0

  // Progression par catégorie (supervision + autonome uniquement, min 1)
  const catProgress = categories.map(cat => {
    const catObjs = activeObjectives.filter(o => o.procedures?.category_id === cat.id)
    const required = catObjs.length
    const done = catObjs.filter(obj => validated.some(r => r.procedures?.id === obj.procedure_id)).length
    return { ...cat, required, done }
  }).filter(c => c.required > 0)

  // Objectifs non atteints (supervision + autonome, au moins 1 requis)
  const notMet = activeObjectives.filter(obj =>
    !validated.some(r => r.procedures?.id === obj.procedure_id)
  ).slice(0, 5)

  const metrics = [
    { label: 'Actes validés', value: stats.validated, icon: CheckCircle, iconBg: '#dcfce7', iconColor: '#166534', href: '/resident/historique?status=validated' },
    { label: 'En attente',    value: stats.pending,   icon: Clock,        iconBg: '#fef9c3', iconColor: '#854d0e', href: '/resident/historique?status=pending' },
    { label: 'Total actes',   value: stats.total,     icon: FileText,     iconBg: '#E8F4FC', iconColor: '#0D2B4E', href: '/resident/historique' },
    { label: 'Refusés',       value: stats.refused,   icon: XCircle,      iconBg: '#fee2e2', iconColor: '#991b1b', href: '/resident/historique?status=refused' },
  ]

  return (
    <div className="p-5 md:p-8 max-w-4xl">
      <PageHeader title="Mon tableau de bord" subtitle={`Année ${year} de résidanat`} />

      {/* Métriques */}
      <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-4">
        {metrics.map(m => (
          <Link key={m.label} href={m.href} className="block hover:scale-[1.02] transition-transform active:scale-[0.98]">
            <MetricCard {...m} />
          </Link>
        ))}
      </div>

      {/* Progression annuelle */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold" style={{ color: '#0D2B4E' }}>Progression annuelle</span>
          <span className="text-slate-500">{doneCount} / {totalRequired} objectifs</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${progressPct}%`, backgroundColor: progressPct >= 80 ? '#166534' : progressPct >= 50 ? '#0D2B4E' : '#854d0e' }} />
        </div>
        <p className="text-xs text-slate-500 mt-1.5 text-right">{progressPct}%</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {/* Actes en attente de validation */}
        {pendingReals.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm" style={{ color: '#0D2B4E' }}>
                En attente de validation
              </p>
              <Link href="/resident/historique?status=pending"
                className="text-xs font-medium" style={{ color: '#7BB8E8' }}>
                Tout voir
              </Link>
            </div>
            <div className="space-y-2">
              {pendingReals.map(r => (
                <Link key={r.id} href={`/resident/historique/${r.id}`}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <Clock size={14} className="text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{r.procedures?.name ?? '—'}</p>
                    <p className="text-[10px] text-slate-500">{formatDate(r.performed_at)}</p>
                  </div>
                  <ChevronRight size={13} className="text-slate-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Objectifs non atteints */}
        {notMet.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm" style={{ color: '#0D2B4E' }}>
                Objectifs à atteindre
              </p>
              <Link href="/resident/referentiel"
                className="text-xs font-medium" style={{ color: '#7BB8E8' }}>
                Voir tout
              </Link>
            </div>
            <div className="space-y-2">
              {notMet.map(obj => {
                const done = validated.filter(r => r.procedures?.id === obj.procedure_id).length
                const pct = Math.round((done / obj.min_count) * 100)
                const cat = obj.procedures?.categories
                return (
                  <div key={obj.procedure_id} className="p-2.5 rounded-xl bg-slate-50">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-xs font-medium text-slate-800 leading-snug">{obj.procedures?.name ?? '—'}</p>
                      <span className="text-[10px] font-semibold flex-shrink-0 text-slate-500">{done}/{obj.min_count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: cat?.color_hex ?? '#0D2B4E' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
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
