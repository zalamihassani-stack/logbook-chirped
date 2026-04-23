import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MetricCard from '@/components/ui/MetricCard'
import PageHeader from '@/components/ui/PageHeader'
import {
  formatDate,
  getResidentYear,
  normalizeObjectives,
  countValidatedAtOrAboveByProcedure,
} from '@/lib/utils'
import { CheckCircle, Clock, FileText, XCircle, ChevronRight } from 'lucide-react'

function getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts) {
  const counts = objective.required_level >= 4 ? autonomyCounts : supervisionCounts
  return counts[objective.procedure_id] ?? 0
}

export default async function ResidentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('residanat_start_date, full_name')
    .eq('id', user.id)
    .single()

  const year = getResidentYear(profile?.residanat_start_date)

  const [realsRes, objectivesRes, categoriesRes, pendingRealsRes] = await Promise.all([
    supabase
      .from('realisations')
      .select('id, status, procedure_id, participation_level, procedures(category_id, id, name, categories(name, color_hex))')
      .eq('resident_id', user.id),
    supabase
      .from('procedure_objectives')
      .select('procedure_id, min_count, required_level, procedures(id, name, category_id, categories(name, color_hex))')
      .eq('year', year),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
    supabase
      .from('realisations')
      .select('id, performed_at, participation_level, status, procedures(name)')
      .eq('resident_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const reals = realsRes.data ?? []
  const objectives = normalizeObjectives(objectivesRes.data).filter((objective) => objective.required_level > 0)
  const categories = categoriesRes.data ?? []
  const pendingReals = pendingRealsRes.data ?? []

  const validated = reals.filter((realisation) => realisation.status === 'validated')
  const supervisionCounts = countValidatedAtOrAboveByProcedure(reals, 3)
  const autonomyCounts = countValidatedAtOrAboveByProcedure(reals, 4)

  const stats = {
    validated: validated.length,
    pending: reals.filter((realisation) => realisation.status === 'pending').length,
    total: reals.length,
    refused: reals.filter((realisation) => realisation.status === 'refused').length,
  }

  const totalRequired = objectives.length
  const doneCount = objectives.filter((objective) => {
    const done = getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts)
    return done >= objective.min_count
  }).length
  const progressPct = totalRequired ? Math.min(100, Math.round((doneCount / totalRequired) * 100)) : 0

  const catProgress = categories
    .map((category) => {
      const catObjectives = objectives.filter((objective) => objective.procedures?.category_id === category.id)
      const required = catObjectives.length
      const done = catObjectives.filter((objective) => {
        const count = getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts)
        return count >= objective.min_count
      }).length
      return { ...category, required, done }
    })
    .filter((category) => category.required > 0)

  const notMet = objectives
    .filter((objective) => {
      const done = getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts)
      return done < objective.min_count
    })
    .slice(0, 5)

  const metrics = [
    { label: 'Actes valides', value: stats.validated, icon: CheckCircle, iconBg: '#dcfce7', iconColor: '#166534', href: '/resident/historique?status=validated' },
    { label: 'En attente', value: stats.pending, icon: Clock, iconBg: '#fef9c3', iconColor: '#854d0e', href: '/resident/historique?status=pending' },
    { label: 'Total actes', value: stats.total, icon: FileText, iconBg: '#E8F4FC', iconColor: '#0D2B4E', href: '/resident/historique' },
    { label: 'Refuses', value: stats.refused, icon: XCircle, iconBg: '#fee2e2', iconColor: '#991b1b', href: '/resident/historique?status=refused' },
  ]

  return (
    <div className="max-w-4xl p-5 md:p-8">
      <PageHeader title="Mon tableau de bord" subtitle={`Annee ${year} de residanat`} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <MetricCard {...metric} />
          </Link>
        ))}
      </div>

      <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold" style={{ color: '#0D2B4E' }}>Progression annuelle</span>
          <span className="text-slate-500">{doneCount} / {totalRequired} objectifs</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: progressPct >= 80 ? '#166534' : progressPct >= 50 ? '#0D2B4E' : '#854d0e' }} />
        </div>
        <p className="mt-1.5 text-right text-xs text-slate-500">{progressPct}%</p>
      </div>

      <div className="mb-5 grid gap-5 md:grid-cols-2">
        {pendingReals.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: '#0D2B4E' }}>En attente de validation</p>
              <Link href="/resident/historique?status=pending" className="text-xs font-medium" style={{ color: '#7BB8E8' }}>
                Tout voir
              </Link>
            </div>
            <div className="space-y-2">
              {pendingReals.map((realisation) => (
                <Link
                  key={realisation.id}
                  href={`/resident/historique/${realisation.id}`}
                  className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 transition-colors hover:bg-slate-100"
                >
                  <Clock size={14} className="flex-shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">{realisation.procedures?.name ?? '-'}</p>
                    <p className="text-[10px] text-slate-500">{formatDate(realisation.performed_at)}</p>
                  </div>
                  <ChevronRight size={13} className="flex-shrink-0 text-slate-300" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {notMet.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: '#0D2B4E' }}>Objectifs a atteindre</p>
              <Link href="/resident/progression" className="text-xs font-medium" style={{ color: '#7BB8E8' }}>
                Voir tout
              </Link>
            </div>
            <div className="space-y-2">
              {notMet.map((objective) => {
                const done = getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts)
                const pct = Math.round((done / objective.min_count) * 100)
                const category = objective.procedures?.categories
                return (
                  <div key={objective.procedure_id} className="rounded-xl bg-slate-50 p-2.5">
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <p className="text-xs font-medium leading-snug text-slate-800">{objective.procedures?.name ?? '-'}</p>
                      <span className="flex-shrink-0 text-[10px] font-semibold text-slate-500">{done}/{objective.min_count}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: category?.color_hex ?? '#0D2B4E' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {catProgress.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold" style={{ color: '#0D2B4E' }}>Par categorie</p>
          <div className="space-y-3">
            {catProgress.map((category) => {
              const pct = category.required ? Math.min(100, Math.round((category.done / category.required) * 100)) : 0
              return (
                <div key={category.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium" style={{ color: category.color_hex }}>{category.name}</span>
                    <span className="text-slate-500">{category.done}/{category.required}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: category.color_hex }} />
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
