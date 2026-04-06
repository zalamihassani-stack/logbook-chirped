import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import ExportGestesButton from './ExportGestesButton'
import { formatDate, PARTICIPATION_LEVELS } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

export default async function HistoriquePage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  const params = await searchParams
  const filterStatus = params?.status ?? ''
  const filterProc = params?.procedure ?? ''
  const filterEnseignant = params?.enseignant ?? ''

  let query = supabase
    .from('realisations')
    .select('id, performed_at, participation_level, status, ipp_patient, enseignant_id, procedures(id, name), profiles!enseignant_id(id, full_name)')
    .eq('resident_id', user.id)
    .order('performed_at', { ascending: false })

  if (filterStatus) query = query.eq('status', filterStatus)
  if (filterProc) query = query.eq('procedure_id', filterProc)
  if (filterEnseignant) query = query.eq('enseignant_id', filterEnseignant)

  const [{ data: realisations }, { data: procedures }, { data: enseignants }] = await Promise.all([
    query,
    supabase.from('procedures').select('id, name').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
  ])

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader title="Mes réalisations" subtitle={`${realisations?.length ?? 0} acte(s)`}
        action={<ExportGestesButton residentName={profile?.full_name} />}
      />

      {/* Filtres */}
      <form className="flex gap-3 mb-5 flex-col sm:flex-row sm:flex-wrap">
        <select name="status" defaultValue={filterStatus}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="validated">Validés</option>
          <option value="refused">Refusés</option>
        </select>
        <select name="procedure" defaultValue={filterProc}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
          <option value="">Tous les gestes</option>
          {procedures?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select name="enseignant" defaultValue={filterEnseignant}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
          <option value="">Tous les enseignants</option>
          {enseignants?.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
        <button type="submit"
          className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#0D2B4E' }}>
          Filtrer
        </button>
      </form>

      <div className="space-y-2">
        {(realisations ?? []).map(r => (
          <Link key={r.id} href={`/resident/historique/${r.id}`}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{r.procedures?.name ?? '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDate(r.performed_at)} · {PARTICIPATION_LEVELS[r.participation_level]}
              </p>
              {r.ipp_patient && <p className="text-xs text-slate-400 mt-0.5">IPP : {r.ipp_patient}</p>}
            </div>
            <Badge status={r.status} />
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </Link>
        ))}
        {(realisations ?? []).length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Aucun acte enregistré</p>
        )}
      </div>
    </div>
  )
}
