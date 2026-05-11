import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import ResubmitForm from './ResubmitForm'
import { formatDate } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'

export default async function DetailRealisationPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: real }, { data: feedback }, { data: enseignants }, { data: residents }] = await Promise.all([
    supabase.from('realisations')
      .select('id, performed_at, activity_type, status, ipp_patient, compte_rendu, commentaire, resident_year_at_time, is_hors_objectifs, procedure_id, enseignant_id, superviseur_resident_id, procedures(name), profiles!enseignant_id(full_name)')
      .eq('id', id).eq('resident_id', user.id).single(),
    admin.from('validation_history')
      .select('action, feedback, created_at, profiles!enseignant_id(full_name)')
      .eq('realisation_id', id).order('created_at', { ascending: false }).limit(1),
    admin.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    admin.from('profiles').select('id, full_name').eq('role', 'resident').eq('is_active', true).neq('id', user.id).order('full_name'),
  ])

  if (!real) notFound()
  const lastFeedback = feedback?.[0]
  const canEdit = real.status === 'pending' || real.status === 'refused'

  return (
    <div className="max-w-2xl p-5 md:p-8">
      <Link href="/resident/historique" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={16} strokeWidth={1.75} />
        Retour
      </Link>
      <PageHeader title={real.procedures?.name ?? 'Détail de réalisation'} subtitle={formatDate(real.performed_at)} />

      <div className="mb-5 space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Badge status={real.status} />
          {real.is_hors_objectifs && (
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">Hors objectifs</span>
          )}
        </div>
        <Row label="Type d'activité" value={ACTIVITY_TYPE_LABELS[real.activity_type] ?? '-'} />
        <Row label="Enseignant" value={real.profiles?.full_name} />
        <Row label="Année résidanat" value={`Année ${real.resident_year_at_time}`} />
        {real.ipp_patient && <Row label="IPP patient" value={real.ipp_patient} />}
        {real.compte_rendu && (
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Compte rendu opératoire</p>
            <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{real.compte_rendu}</p>
          </div>
        )}
        {real.commentaire && <Row label="Commentaire" value={real.commentaire} />}
      </div>

      {lastFeedback?.feedback && (
        <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="mb-1.5 text-xs font-medium text-sky-700">Feedback - {lastFeedback.profiles?.full_name}</p>
          <p className="text-sm text-slate-700">{lastFeedback.feedback}</p>
        </div>
      )}

      {canEdit && (
        <ResubmitForm
          realisationId={id}
          current={real}
          enseignants={enseignants ?? []}
          residents={residents ?? []}
        />
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="w-36 flex-shrink-0 pt-0.5 text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-800">{value ?? '—'}</span>
    </div>
  )
}
