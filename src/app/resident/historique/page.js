import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import ExportGestesButton from './ExportGestesButton'
import { formatDate, maskPatientIdentifier } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'
import { ChevronRight } from 'lucide-react'

const PAGE_SIZE = 25

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
  const page = Math.max(1, Number.parseInt(params?.page ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE

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
    query.range(from, to),
    supabase.from('procedures').select('id, name').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
  ])

  return (
    <div className="max-w-3xl p-5 md:p-8">
      <PageHeader
        title="Mes réalisations"
        subtitle={`${realisations?.length ?? 0} acte(s)`}
        action={<ExportGestesButton residentName={profile?.full_name} />}
      />

      <form className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <select name="status" defaultValue={filterStatus}
          className="min-w-[140px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="validated">Validés</option>
          <option value="refused">Refusés</option>
        </select>
        <select name="procedure" defaultValue={filterProc}
          className="min-w-[140px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
          <option value="">Tous les gestes</option>
          {procedures?.map((procedure) => <option key={procedure.id} value={procedure.id}>{procedure.name}</option>)}
        </select>
        <select name="enseignant" defaultValue={filterEnseignant}
          className="min-w-[140px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
          <option value="">Tous les enseignants</option>
          {enseignants?.map((enseignant) => <option key={enseignant.id} value={enseignant.id}>{enseignant.full_name}</option>)}
        </select>
        <select name="activity" defaultValue={filterActivity}
          className="min-w-[140px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
          <option value="">Tous les niveaux</option>
          <option value="expose">Exposé</option>
          <option value="supervise">Supervisé</option>
          <option value="autonome">Autonome</option>
        </select>
        <select name="year" defaultValue={filterYear}
          className="min-w-[140px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
          <option value="">Toutes les années</option>
          {[1, 2, 3, 4, 5].map((year) => <option key={year} value={year}>Année {year}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="submit"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-navy)' }}>
            Filtrer
          </button>
          {(filterStatus || filterProc || filterEnseignant || filterActivity || filterYear) && (
            <Link href="/resident/historique"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {(realisations ?? []).slice(0, PAGE_SIZE).map((realisation) => (
          <Link key={realisation.id} href={`/resident/historique/${realisation.id}`}
            className={`flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${realisation.status === 'refused' ? 'border border-red-200' : 'border border-slate-100'}`}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-800">{realisation.procedures?.name ?? '—'}</p>
                {realisation.status === 'refused' && (
                  <span className="flex-shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                    Action requise
                  </span>
                )}
                {realisation.status === 'pending' && (
                  <span className="flex-shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                    Modifiable
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDate(realisation.performed_at)} · A{realisation.resident_year_at_time ?? '-'} · {ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '—'}
              </p>
              {realisation.ipp_patient && <p className="mt-0.5 text-xs text-slate-400">IPP : {maskPatientIdentifier(realisation.ipp_patient)}</p>}
            </div>
            <Badge status={realisation.status} />
            <ChevronRight size={16} className="flex-shrink-0 text-slate-300" />
          </Link>
        ))}
        {(realisations ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">Aucun acte enregistré</p>
        )}
      </div>
      <PaginationControls
        page={page}
        hasNext={(realisations ?? []).length > PAGE_SIZE}
        params={params}
      />
    </div>
  )
}

function PaginationControls({ page, hasNext, params }) {
  if (page === 1 && !hasNext) return null

  const previousParams = new URLSearchParams(params)
  const nextParams = new URLSearchParams(params)
  previousParams.set('page', String(Math.max(1, page - 1)))
  nextParams.set('page', String(page + 1))

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={`/resident/historique?${previousParams.toString()}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          Page précédente
        </Link>
      ) : <span />}
      <span className="text-xs text-slate-400">Page {page}</span>
      {hasNext ? (
        <Link href={`/resident/historique?${nextParams.toString()}`} className="rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-navy)' }}>
          Page suivante
        </Link>
      ) : <span />}
    </div>
  )
}
