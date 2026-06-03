import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MetricCard from '@/components/ui/MetricCard'
import PageHeader from '@/components/ui/PageHeader'
import AppCard from '@/components/ui/AppCard'
import { Users, Scissors, ClipboardCheck, AlertCircle, ChevronRight, Database, Settings, FlaskConical, UserX } from 'lucide-react'

const QUICK_NAV = [
  { label: 'Utilisateurs', icon: Users, path: '/admin/utilisateurs', color: 'var(--color-sky)' },
  { label: 'Gestes & Objectifs', icon: Scissors, path: '/admin/gestes', color: '#34a85a' },
  { label: 'Données & Exports', icon: Database, path: '/admin/donnees', color: '#f59e0b' },
  { label: 'Réglages', icon: Settings, path: '/admin/reglages', color: '#8b5cf6' },
]

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [usersRes, inactiveUsersRes, proceduresRes, realisationsRes, pendingRealisationsRes, pendingTravauxRes, auditRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).not('is_active', 'is', false),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', false),
    supabase.from('procedures').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('realisations').select('id', { count: 'exact', head: true }),
    supabase.from('realisations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).in('validation_status', ['pending_initial', 'pending_final']),
    supabase.from('admin_audit_logs').select('id, action, target_type, created_at, admin:profiles!admin_id(full_name)').order('created_at', { ascending: false }).limit(5),
  ])

  const metrics = [
    { label: 'Utilisateurs actifs', value: usersRes.count, icon: Users, iconBg: 'var(--color-ice)', iconColor: 'var(--color-navy)' },
    { label: 'Comptes inactifs', value: inactiveUsersRes.count, icon: UserX, iconBg: '#f1f5f9', iconColor: '#64748b' },
    { label: 'Gestes référentiel', value: proceduresRes.count, icon: Scissors, iconBg: 'var(--color-success-light)', iconColor: 'var(--color-success)' },
    { label: 'Actes enregistrés', value: realisationsRes.count, icon: ClipboardCheck, iconBg: 'var(--color-warning-light)', iconColor: 'var(--color-warning)' },
    { label: 'Actes à valider', value: pendingRealisationsRes.count, icon: AlertCircle, iconBg: 'var(--color-danger-light)', iconColor: 'var(--color-danger)' },
    { label: 'Travaux à valider', value: pendingTravauxRes.count, icon: FlaskConical, iconBg: '#ffedd5', iconColor: '#9a3412' },
  ]

  return (
    <div className="p-5 md:p-8 max-w-4xl">
      <PageHeader title="Tableau de bord" />

      <div className="mb-6 grid grid-cols-2 gap-2.5 md:grid-cols-3">
        {metrics.map(m => <MetricCard key={m.label} {...m} compact />)}
      </div>

      <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-navy)' }}>Navigation rapide</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK_NAV.map(({ label, icon: Icon, path, color }) => (
          <AppCard
            as={Link}
            key={path}
            href={path}
            className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: color + '20' }}>
              <Icon size={22} style={{ color }} strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>{label}</p>
            </div>
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </AppCard>
        ))}
      </div>

      {(auditRes.data ?? []).length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold" style={{ color: 'var(--color-navy)' }}>Activité admin</h2>
          <div className="space-y-2">
            {auditRes.data.map((event) => (
              <AppCard key={event.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{formatAction(event.action)}</p>
                  <p className="text-xs text-slate-400">{event.admin?.full_name ?? 'Admin'} · {event.target_type}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-slate-400">{new Date(event.created_at).toLocaleDateString('fr-FR')}</span>
              </AppCard>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function formatAction(action) {
  return String(action ?? '')
    .replaceAll('_', ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase())
}
