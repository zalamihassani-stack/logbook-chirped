import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import ExportGestesButton from './ExportGestesButton'
import { formatDate } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'
import { ChevronRight } from 'lucide-react'

export default async function HistoriquePage({ searchParams }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  const params = await searchParams
  const filterStatus = params?.status ?? ''
  const filterProc = params?.procedure ?? ''
  const filterEnseignant = params?.enseignant ?? ''
  const filterActivity = params?.activity ?? ''
  const filterYear = params?.year ?? ''

  let query = supabase
    .from('realisations')
    .select('id, performed_at, activity_type, status, ipp_patient, resident_year_at_time, enseignant_id, procedures(id, name), profiles!enseignant_id(id, full_name)')
    .eq('resident_id', user.id)
    .order('performed_at', { ascending: false })

  if (filterStatus) query = query.eq('status', filterStatus)
  if (filterProc) query = query.eq('procedure_id', filterProc)
  if (filterEnseignant) query = query.eq('enseignant_id', filterEnseignant)
  if (filterActivity) query = query.eq('activity_type', filterActivity)
  if (filterYear) query = query.eq('resident_year_at_time', Number.parseInt(filterYear, 10))

  const [{ data: realisations }, { data: procedures }, { data: enseignants }] = await Promise.all([
    query,
    supabase.from('procedures').select('id, name').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
  ])

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader title="Mes realisations" subtitle={`${realisations?.length ?? 0} acte(s)`}
        action={<ExportGestesButton residentName={profile?.full_name} />}
      />

      <form className="flex gap-3 mb-5 flex-col sm:flex-row sm:flex-wrap">
        <select name="status" defaultValue={filterStatus}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="validated">Valides</option>
          <option value="refused">Refuses</option>
        </select>
        <select name="procedure" defaultValue={filterProc}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
          <option value="">Tous les gestes</option>
          {procedures?.map((procedure) => <option key={procedure.id} value={procedure.id}>{procedure.name}</option>)}
        </select>
        <select name="enseignant" defaultValue={filterEnseignant}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
          <option value="">Tous les enseignants</option>
          {enseignants?.map((enseignant) => <option key={enseignant.id} value={enseignant.id}>{enseignant.full_name}</option>)}
        </select>
        <select name="activity" defaultValue={filterActivity}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
          <option value="">Tous les niveaux</option>
          <option value="expose">Exposé</option>
          <option value="supervise">Supervisé</option>
          <option value="autonome">Autonome</option>
        </select>
        <select name="year" defaultValue={filterYear}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
          <option value="">Toutes les années</option>
          {[1, 2, 3, 4, 5].map((year) => <option key={year} value={year}>Année {year}</option>)}
        </select>
        <button type="submit"
          className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#0D2B4E' }}>
          Filtrer
        </button>
      </form>

      <div className="space-y-2">
        {(realisations ?? []).map((realisation) => (
          <Link key={realisation.id} href={`/resident/historique/${realisation.id}`}
            className={`flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md ${realisation.status === 'refused' ? 'border border-red-200' : 'border border-slate-100'}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-800 truncate">{realisation.procedures?.name ?? '—'}</p>
                {realisation.status === 'refused' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-600 flex-shrink-0">
                    Action requise
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDate(realisation.performed_at)} · A{realisation.resident_year_at_time ?? '-'} · {ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '—'}
              </p>
              {realisation.ipp_patient && <p className="text-xs text-slate-400 mt-0.5">IPP : {realisation.ipp_patient}</p>}
            </div>
            <Badge status={realisation.status} />
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </Link>
        ))}
        {(realisations ?? []).length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Aucun acte enregistre</p>
        )}
      </div>
    </div>
  )
}
