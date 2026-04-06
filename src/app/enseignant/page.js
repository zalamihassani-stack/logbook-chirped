import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MetricCard from '@/components/ui/MetricCard'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { ClipboardList, UserCheck, CheckCircle, XCircle, ChevronRight } from 'lucide-react'

export default async function EnseignantDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [pendingRes, validatedRes, refusedRes, residentsRes, recentRes] = await Promise.all([
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('enseignant_id', user.id).eq('status', 'pending'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('enseignant_id', user.id).eq('status', 'validated').gte('updated_at', startOfMonth),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('enseignant_id', user.id).eq('status', 'refused').gte('updated_at', startOfMonth),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'resident').eq('is_active', true),
    supabase.from('realisations')
      .select('id, performed_at, procedures(name), profiles!resident_id(full_name)')
      .eq('enseignant_id', user.id).eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(5),
  ])

  const metrics = [
    { label: 'En attente', value: pendingRes.count, icon: ClipboardList, iconBg: '#fef9c3', iconColor: '#854d0e', href: '/enseignant/demandes?status=pending' },
    { label: 'Validés ce mois', value: validatedRes.count, icon: CheckCircle, iconBg: '#dcfce7', iconColor: '#166534', href: '/enseignant/demandes?status=validated' },
    { label: 'Résidents actifs', value: residentsRes.count, icon: UserCheck, iconBg: '#E8F4FC', iconColor: '#0D2B4E', href: '/enseignant/residents' },
    { label: 'Refusés ce mois', value: refusedRes.count, icon: XCircle, iconBg: '#fee2e2', iconColor: '#991b1b', href: '/enseignant/demandes?status=refused' },
  ]

  return (
    <div className="p-5 md:p-8 max-w-4xl">
      <PageHeader title="Tableau de bord" subtitle="Vos demandes et résidents" />
      <div className="grid grid-cols-2 gap-3 mb-8 md:grid-cols-4">
        {metrics.map(m => (
          <Link key={m.label} href={m.href} className="block hover:scale-[1.02] transition-transform active:scale-[0.98]">
            <MetricCard {...m} />
          </Link>
        ))}
      </div>
      <h2 className="text-base font-semibold mb-3" style={{ color: '#0D2B4E' }}>Dernières demandes en attente</h2>
      <div className="space-y-2">
        {(recentRes.data ?? []).map(r => (
          <Link key={r.id} href={`/enseignant/demandes/${r.id}`}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{r.procedures?.name ?? '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">{r.profiles?.full_name} · {formatDate(r.performed_at)}</p>
            </div>
            <Badge status="pending" />
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </Link>
        ))}
        {(recentRes.data ?? []).length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">Aucune demande en attente</p>
        )}
      </div>
    </div>
  )
}
