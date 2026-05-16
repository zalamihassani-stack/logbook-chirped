import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import StatusTabs from '@/components/ui/StatusTabs'
import FilterPanel from '@/components/ui/FilterPanel'
import PaginationControls from '@/components/ui/PaginationControls'
import ListRowCard from '@/components/ui/ListRowCard'
import { formatDate, maskPatientIdentifier } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'
import ActesTab from '../suivi/ActesTab'

const PAGE_SIZE = 25
const STATUS_LABELS = { pending: 'En attente', validated: 'Validées', refused: 'Refusées' }
const STATUS_ORDER = { pending: 0, validated: 1, refused: 2 }
const STATUS_TABS = [
  { value: '', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'validated', label: 'Validées' },
  { value: 'refused', label: 'Refusées' },
]
const MODE_TABS = [
  { value: '', label: 'Mes demandes' },
  { value: 'journal', label: 'Tous les actes' },
]

export default async function DemandesPage({ searchParams }) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const mode = params?.mode ?? ''

  if (mode === 'journal') {
    const [{ data: residents }, { data: procedures }, { data: enseignants }] = await Promise.all([
      admin.from('profiles').select('id, full_name').eq('role', 'resident').eq('is_active', true).order('full_name'),
      supabase.from('procedures').select('id, name').eq('is_active', true).order('name'),
      admin.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    ])

    return (
      <div className="max-w-3xl p-5 md:p-8">
        <PageHeader title="Demandes" subtitle="Journal de tous les actes" />
        <StatusTabs tabs={MODE_TABS} activeValue={mode} hrefFor={(value) => value ? `/enseignant/demandes?mode=${value}` : '/enseignant/demandes'} columns={2} className="mb-5" />
        <ActesTab residents={residents ?? []} procedures={procedures ?? []} enseignants={enseignants ?? []} />
      </div>
    )
  }

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
    '': (pendingCount.count ?? 0) + (validatedCount.count ?? 0) + (refusedCount.count ?? 0),
    pending: pendingCount.count ?? 0,
    validated: validatedCount.count ?? 0,
    refused: refusedCount.count ?? 0,
  }
  const hasFilters = Boolean(filterResident || filterProcedure)

  return (
    <div className="max-w-3xl p-5 md:p-8">
      <PageHeader
        title="Demandes"
        subtitle={`${counts[filterStatus] ?? sorted.length} demande(s)${filterStatus ? ` · ${STATUS_LABELS[filterStatus]}` : ''}`}
      />

      <StatusTabs tabs={MODE_TABS} activeValue={mode} hrefFor={(value) => value ? `/enseignant/demandes?mode=${value}` : '/enseignant/demandes'} columns={2} className="mb-5" />
      <StatusTabs tabs={STATUS_TABS} activeValue={filterStatus} counts={counts} hrefFor={(status) => statusHref(status, { filterResident, filterProcedure })} columns={4} className="mb-5" />

      <FilterPanel active={hasFilters} className="mb-5">
        <form className="grid gap-3 sm:grid-cols-2">
          {filterStatus && <input type="hidden" name="status" value={filterStatus} />}
          <select name="resident" defaultValue={filterResident} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            <option value="">Tous les résidents</option>
            {residents?.map((resident) => <option key={resident.id} value={resident.id}>{resident.full_name}</option>)}
          </select>
          <select name="procedure" defaultValue={filterProcedure} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            <option value="">Tous les gestes</option>
            {procedures?.map((procedure) => <option key={procedure.id} value={procedure.id}>{procedure.name}</option>)}
          </select>
          <button type="submit" className="rounded-lg px-4 py-2 text-sm font-medium text-white sm:col-span-2" style={{ backgroundColor: 'var(--color-navy)' }}>
            Appliquer les filtres
          </button>
          {hasFilters && (
            <Link href={statusHref(filterStatus, {})} className="rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-500 hover:text-slate-700 sm:col-span-2">
              Réinitialiser les filtres
            </Link>
          )}
        </form>
      </FilterPanel>

      <div className="space-y-2">
        {sorted.slice(0, PAGE_SIZE).map((realisation) => (
          <ListRowCard
            key={realisation.id}
            href={`/enseignant/demandes/${realisation.id}`}
            title={realisation.procedures?.name ?? '-'}
            subtitle={`${realisation.resident?.full_name ?? '-'} · ${formatDate(realisation.performed_at)} · ${ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '-'}`}
            meta={realisation.ipp_patient ? `IPP : ${maskPatientIdentifier(realisation.ipp_patient)}` : ''}
            badge={!filterStatus && <Badge status={realisation.status} />}
          />
        ))}
        {sorted.length === 0 && <p className="rounded-2xl bg-white py-8 text-center text-sm text-slate-400">Aucune demande</p>}
      </div>

      <PaginationControls page={page} hasNext={sorted.length > PAGE_SIZE} params={params} basePath="/enseignant/demandes" />
    </div>
  )
}

function statusHref(status, filters = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (filters.filterResident) params.set('resident', filters.filterResident)
  if (filters.filterProcedure) params.set('procedure', filters.filterProcedure)
  const qs = params.toString()
  return `/enseignant/demandes${qs ? `?${qs}` : ''}`
}

