import { createClient } from '@/lib/supabase/server'
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: real }, { data: feedback }, { data: procedures }, { data: enseignants }] = await Promise.all([
    supabase.from('realisations')
      .select('id, performed_at, activity_type, status, ipp_patient, compte_rendu, commentaire, resident_year_at_time, is_hors_objectifs, procedure_id, enseignant_id, procedures(name), profiles!enseignant_id(full_name)')
      .eq('id', id).eq('resident_id', user.id).single(),
    supabase.from('validation_history')
      .select('action, feedback, created_at, profiles!enseignant_id(full_name)')
      .eq('realisation_id', id).order('created_at', { ascending: false }).limit(1),
    supabase.from('procedures').select('id, name').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
  ])

  if (!real) notFound()
  const lastFeedback = feedback?.[0]

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <Link href="/resident/historique" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft size={16} strokeWidth={1.75} />
        Retour
      </Link>
      <PageHeader title={real.procedures?.name ?? 'Detail realisation'} subtitle={formatDate(real.performed_at)} />

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-5 space-y-3">
        <div className="flex items-center gap-2">
          <Badge status={real.status} />
          {real.is_hors_objectifs && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Hors objectifs</span>
          )}
        </div>
        <Row label="Type d'activite" value={ACTIVITY_TYPE_LABELS[real.activity_type] ?? '-'} />
        <Row label="Enseignant" value={real.profiles?.full_name} />
        <Row label="Annee residanat" value={`Annee ${real.resident_year_at_time}`} />
        {real.ipp_patient && <Row label="IPP patient" value={real.ipp_patient} />}
        {real.compte_rendu && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Compte rendu operatoire</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{real.compte_rendu}</p>
          </div>
        )}
        {real.commentaire && <Row label="Commentaire" value={real.commentaire} />}
      </div>

      {lastFeedback?.feedback && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mb-5">
          <p className="text-xs font-medium text-sky-700 mb-1.5">Feedback - {lastFeedback.profiles?.full_name}</p>
          <p className="text-sm text-slate-700">{lastFeedback.feedback}</p>
        </div>
      )}

      {real.status === 'refused' && (
        <ResubmitForm
          realisationId={id}
          current={real}
          procedures={procedures ?? []}
          enseignants={enseignants ?? []}
        />
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-medium text-slate-500 w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800">{value ?? '—'}</span>
    </div>
  )
}
