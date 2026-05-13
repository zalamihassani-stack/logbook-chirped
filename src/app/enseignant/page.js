import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MetricCard from '@/components/ui/MetricCard'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { TRAVAIL_VALIDATION_LABELS, TRAVAIL_VALIDATION_STYLES } from '@/lib/travaux'
import { ClipboardList, UserCheck, CheckCircle, XCircle, ChevronRight, FlaskConical } from 'lucide-react'

export default async function EnseignantDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    pendingRes,
    validatedRes,
    refusedRes,
    residentsRes,
    recentRes,
    pendingTravauxRes,
    pendingInitialTravauxRes,
    pendingFinalTravauxRes,
    recentFinalTravauxRes,
    recentTravauxRes,
  ] = await Promise.all([
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('enseignant_id', user.id).eq('status', 'pending'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('enseignant_id', user.id).eq('status', 'validated').gte('updated_at', startOfMonth),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('enseignant_id', user.id).eq('status', 'refused').gte('updated_at', startOfMonth),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'resident').eq('is_active', true),
    supabase.from('realisations')
      .select('id, performed_at, procedures(name), profiles!resident_id(full_name)')
      .eq('enseignant_id', user.id).eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(5),
    supabase
      .from('travaux_scientifiques')
      .select('*', { count: 'exact', head: true })
      .eq('encadrant_id', user.id)
      .in('validation_status', ['pending_initial', 'pending_final']),
    supabase
      .from('travaux_scientifiques')
      .select('*', { count: 'exact', head: true })
      .eq('encadrant_id', user.id)
      .eq('validation_status', 'pending_initial'),
    supabase
      .from('travaux_scientifiques')
      .select('*', { count: 'exact', head: true })
      .eq('encadrant_id', user.id)
      .eq('validation_status', 'pending_final'),
    supabase
      .from('travaux_scientifiques')
      .select('id, title, year, validation_status, resident:profiles!resident_id(full_name), travail_types(name, color_hex)')
      .eq('encadrant_id', user.id)
      .eq('validation_status', 'pending_final')
      .order('year', { ascending: false })
      .limit(3),
    supabase
      .from('travaux_scientifiques')
      .select('id, title, year, validation_status, resident:profiles!resident_id(full_name), travail_types(name, color_hex)')
      .eq('encadrant_id', user.id)
      .eq('validation_status', 'pending_initial')
      .order('year', { ascending: false })
      .limit(5),
  ])

  const metrics = [
    { label: 'Actes en attente', value: pendingRes.count, icon: ClipboardList, iconBg: '#fef9c3', iconColor: '#854d0e', href: '/enseignant/demandes?status=pending' },
    { label: 'Travaux à valider', value: pendingTravauxRes.count, icon: FlaskConical, iconBg: '#ffedd5', iconColor: '#9a3412', href: '/enseignant/travaux' },
    { label: 'Validation finale', value: pendingFinalTravauxRes.count, icon: CheckCircle, iconBg: '#dcfce7', iconColor: '#166534', href: '/enseignant/travaux?validation=pending_final' },
    { label: 'Validés ce mois', value: validatedRes.count, icon: CheckCircle, iconBg: '#dcfce7', iconColor: '#166534', href: '/enseignant/demandes?status=validated' },
    { label: 'Résidents actifs', value: residentsRes.count, icon: UserCheck, iconBg: '#E8F4FC', iconColor: '#0D2B4E', href: '/enseignant/residents' },
    { label: 'Refusés ce mois', value: refusedRes.count, icon: XCircle, iconBg: '#fee2e2', iconColor: '#991b1b', href: '/enseignant/demandes?status=refused' },
  ]

  return (
    <div className="p-5 md:p-8 max-w-6xl">
      <PageHeader title="Tableau de bord" subtitle="Vos demandes et résidents" />
      <div className="grid grid-cols-2 gap-3 mb-8 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="block hover:scale-[1.02] transition-transform active:scale-[0.98]">
            <MetricCard {...metric} />
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardPanel title="Dernières demandes en attente" href="/enseignant/demandes?status=pending">
          {(recentRes.data ?? []).map((realisation) => (
            <Link key={realisation.id} href={`/enseignant/demandes/${realisation.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{realisation.procedures?.name ?? '—'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{realisation.profiles?.full_name} · {formatDate(realisation.performed_at)}</p>
              </div>
              <Badge status="pending" />
              <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
            </Link>
          ))}
          {(recentRes.data ?? []).length === 0 && <p className="text-center text-sm text-slate-400 py-6">Aucune demande en attente</p>}
        </DashboardPanel>

        <DashboardPanel
          title={`Travaux scientifiques à valider (${pendingInitialTravauxRes.count ?? 0} initiale · ${pendingFinalTravauxRes.count ?? 0} finale)`}
          href="/enseignant/travaux"
        >
          {(recentFinalTravauxRes.data ?? []).length > 0 && (
            <div className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-emerald-800">Validations finales soumises</p>
                <Link href="/enseignant/travaux?validation=pending_final" className="text-xs font-medium text-emerald-800">Voir</Link>
              </div>
              <div className="space-y-2">
                {(recentFinalTravauxRes.data ?? []).map((travail) => <TravailRow key={travail.id} travail={travail} />)}
              </div>
            </div>
          )}
          {(recentTravauxRes.data ?? []).map((travail) => <TravailRow key={travail.id} travail={travail} />)}
          {(recentTravauxRes.data ?? []).length === 0 && <p className="text-center text-sm text-slate-400 py-6">Aucun travail en attente</p>}
        </DashboardPanel>
      </div>
    </div>
  )
}

function DashboardPanel({ title, href, children }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold" style={{ color: '#0D2B4E' }}>{title}</h2>
        <Link href={href} className="text-xs font-medium" style={{ color: '#0D2B4E' }}>Tout voir</Link>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function TravailRow({ travail }) {
  const style = TRAVAIL_VALIDATION_STYLES[travail.validation_status] ?? { bg: '#f1f5f9', color: '#64748b' }
  return (
    <Link href={`/enseignant/travaux?validation=${travail.validation_status}`}
      className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: style.bg, color: style.color }}>
        <FlaskConical size={17} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{travail.title ?? '—'}</p>
        <p className="text-xs text-slate-500 mt-0.5">{travail.resident?.full_name ?? '—'} · {travail.year}</p>
      </div>
      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: style.bg, color: style.color }}>
        {TRAVAIL_VALIDATION_LABELS[travail.validation_status] ?? travail.validation_status}
      </span>
      <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
    </Link>
  )
}
