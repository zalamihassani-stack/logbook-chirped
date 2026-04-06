import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDate, PARTICIPATION_LEVELS } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

export default async function DemandesPage({ searchParams }) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const filterResident = params?.resident ?? ''
  const filterProcedure = params?.procedure ?? ''

  let query = admin
    .from('realisations')
    .select('id, performed_at, participation_level, ipp_patient, procedures(id, name), resident:profiles!resident_id(id, full_name)')
    .eq('enseignant_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (filterResident) query = query.eq('resident_id', filterResident)
  if (filterProcedure) query = query.eq('procedure_id', filterProcedure)

  const { data: realisations } = await query
  const { data: residents } = await admin.from('profiles').select('id, full_name').eq('role', 'resident').order('full_name')
  const { data: procedures } = await supabase.from('procedures').select('id, name').eq('is_active', true).order('name')

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader title="Demandes en attente" subtitle={`${realisations?.length ?? 0} demande(s)`} />

      {/* Filtres */}
      <form className="flex gap-3 mb-5 flex-col sm:flex-row">
        <select name="resident" defaultValue={filterResident}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
          <option value="">Tous les résidents</option>
          {residents?.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
        </select>
        <select name="procedure" defaultValue={filterProcedure}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
          <option value="">Tous les gestes</option>
          {procedures?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button type="submit"
          className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#0D2B4E' }}>
          Filtrer
        </button>
      </form>

      <div className="space-y-2">
        {(realisations ?? []).map(r => (
          <Link key={r.id} href={`/enseignant/demandes/${r.id}`}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{r.procedures?.name ?? '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {r.resident?.full_name} · {formatDate(r.performed_at)} · {PARTICIPATION_LEVELS[r.participation_level]}
              </p>
              {r.ipp_patient && <p className="text-xs text-slate-400 mt-0.5">IPP : {r.ipp_patient}</p>}
            </div>
            <Badge status="pending" />
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </Link>
        ))}
        {(realisations ?? []).length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Aucune demande en attente</p>
        )}
      </div>
    </div>
  )
}
