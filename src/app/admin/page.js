import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MetricCard from '@/components/ui/MetricCard'
import PageHeader from '@/components/ui/PageHeader'
import { Users, Scissors, ClipboardCheck, GraduationCap, ChevronRight, Database, Settings } from 'lucide-react'

const QUICK_NAV = [
  { label: 'Utilisateurs', desc: 'Gérer les comptes résidents et enseignants', icon: Users, path: '/admin/utilisateurs', color: 'var(--color-sky)' },
  { label: 'Gestes & Objectifs', desc: 'Référentiel des procédures et objectifs par année', icon: Scissors, path: '/admin/gestes', color: '#34a85a' },
  { label: 'Données & Exports', desc: 'Statistiques, exports PDF et CSV', icon: Database, path: '/admin/donnees', color: '#f59e0b' },
  { label: 'Réglages', desc: "Configuration générale de l'application", icon: Settings, path: '/admin/reglages', color: '#8b5cf6' },
]

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [usersRes, proceduresRes, realisationsRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('procedures').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('realisations').select('*', { count: 'exact', head: true }),
  ])

  const metrics = [
    { label: 'Utilisateurs', value: usersRes.count, icon: Users, iconBg: 'var(--color-ice)', iconColor: 'var(--color-navy)' },
    { label: 'Gestes référentiel', value: proceduresRes.count, icon: Scissors, iconBg: 'var(--color-success-light)', iconColor: 'var(--color-success)' },
    { label: 'Actes enregistrés', value: realisationsRes.count, icon: ClipboardCheck, iconBg: 'var(--color-warning-light)', iconColor: 'var(--color-warning)' },
    { label: 'Années de formation', value: 5, icon: GraduationCap, iconBg: '#ede9fe', iconColor: '#5b21b6' },
  ]

  return (
    <div className="p-5 md:p-8 max-w-4xl">
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de l'application" />

      <div className="grid grid-cols-2 gap-3 mb-8 md:grid-cols-4">
        {metrics.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-navy)' }}>Navigation rapide</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK_NAV.map(({ label, desc, icon: Icon, path, color }) => (
          <Link key={path} href={path}
            className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: color + '20' }}>
              <Icon size={22} style={{ color }} strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>{label}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
