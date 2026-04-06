import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import { getInitials, getResidentYear } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

export default async function ResidentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: residents } = await supabase
    .from('profiles').select('id, full_name, residanat_start_date, promotion').eq('role', 'resident').eq('is_active', true).order('full_name')

  // Pour chaque résident, récupérer les stats
  const statsRes = await Promise.all(
    (residents ?? []).map(r =>
      supabase.from('realisations').select('status').eq('resident_id', r.id)
    )
  )

  const residentsWithStats = (residents ?? []).map((r, i) => {
    const reals = statsRes[i].data ?? []
    const validated = reals.filter(x => x.status === 'validated').length
    return { ...r, total: reals.length, validated, year: getResidentYear(r.residanat_start_date) }
  })

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader title="Suivi résidents" subtitle={`${residentsWithStats.length} résident(s) actif(s)`} />
      <div className="space-y-2">
        {residentsWithStats.map(r => (
          <Link key={r.id} href={`/enseignant/residents/${r.id}`}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: '#E8F4FC', color: '#0D2B4E' }}>
              {getInitials(r.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{r.full_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">Année {r.year} · {r.validated}/{r.total} actes validés</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden w-full max-w-48">
                <div className="h-full rounded-full transition-all"
                  style={{ width: r.total ? `${Math.min(100, (r.validated / r.total) * 100)}%` : '0%', backgroundColor: '#0D2B4E' }} />
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </Link>
        ))}
        {residentsWithStats.length === 0 && <p className="text-center text-sm text-slate-400 py-8">Aucun résident actif</p>}
      </div>
    </div>
  )
}
