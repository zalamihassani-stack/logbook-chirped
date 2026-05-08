import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'
import { ChevronRight } from 'lucide-react'

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

  let query = admin
    .from('realisations')
    .select('id, performed_at, activity_type, ipp_patient, status, procedures(id, name), resident:profiles!resident_id(id, full_name)')
    .eq('enseignant_id', user.id)
    .order('created_at', { ascending: false })

  if (filterStatus) query = query.eq('status', filterStatus)
  if (filterResident) query = query.eq('resident_id', filterResident)
  if (filterProcedure) query = query.eq('procedure_id', filterProcedure)

  const { data: realisations } = await query
  const { data: residents } = await admin.from('profiles').select('id, full_name').eq('role', 'resident').order('full_name')
  const { data: procedures } = await supabase.from('procedures').select('id, name').eq('is_active', true).order('name')

  const sorted = filterStatus
    ? (realisations ?? [])
    : [...(realisations ?? [])].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))

  const counts = {
    pending: (realisations ?? []).filter((realisation) => realisation.status === 'pending').length,
    validated: (realisations ?? []).filter((realisation) => realisation.status === 'validated').length,
    refused: (realisations ?? []).filter((realisation) => realisation.status === 'refused').length,
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
                ? { backgroundColor: '#0D2B4E', color: 'white' }
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
          className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#0D2B4E' }}>
          Filtrer
        </button>
      </form>

      <div className="space-y-2">
        {sorted.map((realisation) => (
          <Link key={realisation.id} href={`/enseignant/demandes/${realisation.id}`}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{realisation.procedures?.name ?? '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {realisation.resident?.full_name} · {formatDate(realisation.performed_at)} · {ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '—'}
              </p>
              {realisation.ipp_patient && <p className="text-xs text-slate-400 mt-0.5">IPP : {realisation.ipp_patient}</p>}
            </div>
            <Badge status={realisation.status} />
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </Link>
        ))}
        {sorted.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Aucune demande</p>
        )}
      </div>
    </div>
  )
}
