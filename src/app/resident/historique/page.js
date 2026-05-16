import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import ExportGestesButton from './ExportGestesButton'
import HistoriqueFilters from './HistoriqueFilters'
import { formatDate, maskPatientIdentifier } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'
import { ChevronRight } from 'lucide-react'

const PAGE_SIZE = 25

const STATUS_TABS = [
  { value: '', label: 'Tous' },
  { value: 'validated', label: 'Validés' },
  { value: 'pending', label: 'En attente' },
  { value: 'refused', label: 'Refusés' },
]

export default async function HistoriquePage({ searchParams }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  const params = await searchParams
  const filterStatus = ['validated', 'pending', 'refused'].includes(params?.status) ? params.status : ''
  const filterEnseignant = params?.enseignant ?? ''
  const filterActivity = params?.activity ?? ''
  const dateFrom = params?.from ?? ''
  const dateTo = params?.to ?? ''
  const filterQuery = typeof params?.q === 'string' ? params.q.trim() : ''
  const page = Math.max(1, Number.parseInt(params?.page ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE

  let procedureFilter = null
  if (filterQuery) {
    const { data: matchedProcedures } = await supabase
      .from('procedures')
      .select('id')
      .ilike('name', `%${filterQuery}%`)
    procedureFilter = (matchedProcedures ?? []).map((p) => p.id)
  }

  let query = supabase
    .from('realisations')
    .select('id, performed_at, activity_type, status, ipp_patient, resident_year_at_time, enseignant_id, procedures(id, name), profiles!enseignant_id(id, full_name)')
    .eq('resident_id', user.id)
    .order('performed_at', { ascending: false })

  if (filterStatus) query = query.eq('status', filterStatus)
  if (filterEnseignant) query = query.eq('enseignant_id', filterEnseignant)
  if (filterActivity) query = query.eq('activity_type', filterActivity)
  if (dateFrom) query = query.gte('performed_at', dateFrom)
  if (dateTo) query = query.lte('performed_at', dateTo)
  if (procedureFilter !== null) {
    query = procedureFilter.length > 0
      ? query.in('procedure_id', procedureFilter)
      : query.eq('procedure_id', '00000000-0000-0000-0000-000000000000')
  }

  const [
    { data: realisations },
    { data: enseignants },
    totalRes,
    validatedRes,
    pendingRes,
    refusedRes,
  ] = await Promise.all([
    query.range(from, to),
    supabase.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'validated'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'pending'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'refused'),
  ])

  const counts = {
    '': totalRes.count ?? 0,
    validated: validatedRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    refused: refusedRes.count ?? 0,
  }
  const hasFilters = Boolean(filterEnseignant || filterActivity || dateFrom || dateTo || filterQuery)

  return (
    <div className="max-w-3xl p-5 md:p-8">
      <PageHeader
        title="Mes actes"
        subtitle={`${counts[filterStatus]} acte(s)`}
        action={<ExportGestesButton residentName={profile?.full_name} />}
      />

      <div className="mb-5 grid grid-cols-4 gap-1 rounded-2xl bg-slate-100 p-1">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.label}
            href={statusHref(tab.value)}
            className="rounded-xl px-1.5 py-2 text-center text-xs font-semibold transition sm:px-3 sm:text-sm"
            style={filterStatus === tab.value ? { backgroundColor: 'var(--color-navy)', color: 'white' } : { color: '#64748b' }}
          >
            <span className="block truncate">{tab.label}</span>
            <span className="text-xs opacity-75">{counts[tab.value]}</span>
          </Link>
        ))}
      </div>

      <HistoriqueFilters
        filterStatus={filterStatus}
        filterActivity={filterActivity}
        filterEnseignant={filterEnseignant}
        dateFrom={dateFrom}
        dateTo={dateTo}
        query={filterQuery}
        enseignants={enseignants}
        hasFilters={hasFilters}
      />

      <div className="space-y-2">
        {(realisations ?? []).slice(0, PAGE_SIZE).map((realisation) => (
          <Link key={realisation.id} href={`/resident/historique/${realisation.id}`}
            className={`flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${realisation.status === 'refused' ? 'border border-red-200' : 'border border-slate-100'}`}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-800">{realisation.procedures?.name ?? '-'}</p>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDate(realisation.performed_at)} · A{realisation.resident_year_at_time ?? '-'} · {ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '-'}
              </p>
              {realisation.ipp_patient && <p className="mt-0.5 text-xs text-slate-400">IPP : {maskPatientIdentifier(realisation.ipp_patient)}</p>}
            </div>
            {!filterStatus && <Badge status={realisation.status} />}
            <ChevronRight size={16} className="flex-shrink-0 text-slate-300" />
          </Link>
        ))}
        {(realisations ?? []).length === 0 && (
          <p className="rounded-2xl bg-white py-8 text-center text-sm text-slate-400">Aucun acte</p>
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

function statusHref(status) {
  return status ? `/resident/historique?status=${status}` : '/resident/historique'
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
