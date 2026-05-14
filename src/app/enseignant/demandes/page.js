import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDate, maskPatientIdentifier } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'
import { ChevronRight } from 'lucide-react'

const PAGE_SIZE = 25
const STATUS_LABELS = { pending: 'En attente', validated: 'Valides', refused: 'Refuses' }
const STATUS_ORDER = { pending: 0, validated: 1, refused: 2 }

export default async function DemandesPage({ searchParams }) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const filterStatus = params?.status ?? ''
  const filterResident = params?.resident ?? ''
  const filterProcedure = params?.procedure ?? ''
  const page = Math.max(1, Number.parseInt(params?.page ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE

  const baseQuery = (status = filterStatus, select = 'id') => {
    let scoped = admin
      .from('realisations')
      .select(select, select === 'id' ? { count: 'exact', head: true } : undefined)
      .eq('enseignant_id', user.id)

    if (status) scoped = scoped.eq('status', status)
    if (filterResident) scoped = scoped.eq('resident_id', filterResident)
    if (filterProcedure) scoped = scoped.eq('procedure_id', filterProcedure)
    return scoped
  }

  const listQuery = baseQuery(
    filterStatus,
    'id, performed_at, activity_type, ipp_patient, status, procedures(id, name), resident:profiles!resident_id(id, full_name)'
  ).order('created_at', { ascending: false }).range(from, to)

  const [
    { data: realisations },
    { data: residents },
    { data: procedures },
    pendingCount,
    validatedCount,
    refusedCount,
  ] = await Promise.all([
    listQuery,
    admin.from('profiles').select('id, full_name').eq('role', 'resident').order('full_name'),
    supabase.from('procedures').select('id, name').eq('is_active', true).order('name'),
    baseQuery('pending'),
    baseQuery('validated'),
    baseQuery('refused'),
  ])

  const sorted = filterStatus
    ? (realisations ?? [])
    : [...(realisations ?? [])].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))

  const counts = {
    pending: pendingCount.count ?? 0,
    validated: validatedCount.count ?? 0,
    refused: refusedCount.count ?? 0,
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader
        title="Demandes"
        subtitle={`${sorted.length} demande(s)${filterStatus ? ` · ${STATUS_LABELS[filterStatus]}` : ''}`}
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: '', label: 'Toutes' },
          { value: 'pending', label: `En attente (${counts.pending})` },
          { value: 'validated', label: `Validees (${counts.validated})` },
          { value: 'refused', label: `Refusees (${counts.refused})` },
        ].map((tab) => {
          const isActive = filterStatus === tab.value
          const nextParams = new URLSearchParams({ ...(filterResident && { resident: filterResident }), ...(filterProcedure && { procedure: filterProcedure }), ...(tab.value && { status: tab.value }) })
          return (
            <Link
              key={tab.value}
              href={`/enseignant/demandes${nextParams.toString() ? `?${nextParams.toString()}` : ''}`}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={isActive
                ? { backgroundColor: 'var(--color-navy)', color: 'white' }
                : { backgroundColor: 'white', color: '#475569', border: '1px solid #e2e8f0' }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <form className="flex gap-3 mb-5 flex-col sm:flex-row">
        {filterStatus && <input type="hidden" name="status" value={filterStatus} />}
        <select name="resident" defaultValue={filterResident}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
          <option value="">Tous les residents</option>
          {residents?.map((resident) => <option key={resident.id} value={resident.id}>{resident.full_name}</option>)}
        </select>
        <select name="procedure" defaultValue={filterProcedure}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
          <option value="">Tous les gestes</option>
          {procedures?.map((procedure) => <option key={procedure.id} value={procedure.id}>{procedure.name}</option>)}
        </select>
        <button type="submit"
          className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: 'var(--color-navy)' }}>
          Filtrer
        </button>
      </form>

      <div className="space-y-2">
        {sorted.slice(0, PAGE_SIZE).map((realisation) => (
          <Link key={realisation.id} href={`/enseignant/demandes/${realisation.id}`}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{realisation.procedures?.name ?? '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {realisation.resident?.full_name} · {formatDate(realisation.performed_at)} · {ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '—'}
              </p>
              {realisation.ipp_patient && <p className="text-xs text-slate-400 mt-0.5">IPP : {maskPatientIdentifier(realisation.ipp_patient)}</p>}
            </div>
            <Badge status={realisation.status} />
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </Link>
        ))}
        {sorted.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Aucune demande</p>
        )}
      </div>

      <PaginationControls
        page={page}
        hasNext={sorted.length > PAGE_SIZE}
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
        <Link href={`/enseignant/demandes?${previousParams.toString()}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          Page précédente
        </Link>
      ) : <span />}
      {hasNext && (
        <Link href={`/enseignant/demandes?${nextParams.toString()}`} className="rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-navy)' }}>
          Page suivante
        </Link>
      )}
    </div>
  )
}
