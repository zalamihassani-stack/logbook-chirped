import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'

const OBJECTIVE_LABELS = {
  1: 'Exposition',
  2: 'Supervision',
  3: 'Maitrise',
}

const ACTION_LABELS = {
  submitted: 'Soumis',
  resubmitted: 'Renvoye',
  validated: 'Valide',
  refused: 'Refuse',
}

export default async function DetailRealisationPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: real }, { data: feedback }] = await Promise.all([
    supabase.from('realisations')
      .select('id, created_at, updated_at, performed_at, activity_type, status, ipp_patient, compte_rendu, commentaire, resident_year_at_time, is_hors_objectifs, procedure_id, enseignant_id, superviseur_resident_id, procedures(id, name, pathologie, target_level, target_count, target_year, categories(name, color_hex)), profiles!enseignant_id(full_name), superviseur:profiles!superviseur_resident_id(full_name)')
      .eq('id', id).eq('resident_id', user.id).single(),
    admin.from('validation_history')
      .select('action, feedback, created_at, profiles!enseignant_id(full_name)')
      .eq('realisation_id', id).order('created_at', { ascending: false }).limit(12),
  ])

  if (!real) notFound()
  const lastFeedback = feedback?.find((item) => item.feedback)
  const canEdit = real.status === 'pending' || real.status === 'refused'
  const procedure = real.procedures
  const targetLabel = OBJECTIVE_LABELS[procedure?.target_level] ?? '-'
  const targetSummary = procedure?.target_level
    ? `${targetLabel} - ${procedure.target_count ?? 1} acte(s) cible A${procedure.target_year ?? '-'}`
    : '-'

  return (
    <div className="max-w-2xl p-5 md:p-8">
      <Link href="/resident/historique" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={16} strokeWidth={1.75} />
        Mes actes
      </Link>
      <PageHeader title={procedure?.name ?? 'Detail de realisation'} subtitle={formatDate(real.performed_at)} />

      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge status={real.status} className="px-3 py-1" />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {ACTIVITY_TYPE_LABELS[real.activity_type] ?? '-'}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            A{real.resident_year_at_time ?? '-'}
          </span>
          {real.is_hors_objectifs && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">Hors objectifs</span>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem label="Date de l'acte" value={formatDate(real.performed_at)} />
          <InfoItem label="Niveau realise" value={ACTIVITY_TYPE_LABELS[real.activity_type] ?? '-'} />
          <InfoItem label="Encadrant" value={real.profiles?.full_name} />
          <InfoItem label="Resident superviseur" value={real.superviseur?.full_name ?? 'Aucun'} />
          <InfoItem label="Objectif du geste" value={targetSummary} />
          <InfoItem label="Categorie" value={procedure?.categories?.name ?? '-'} />
          <InfoItem label="Pathologie" value={procedure?.pathologie ?? '-'} />
          <InfoItem label="IPP patient" value={real.ipp_patient ?? 'Non renseigne'} />
          <InfoItem label="Soumis le" value={formatDateTime(real.created_at)} />
          <InfoItem label="Derniere modification" value={formatDateTime(real.updated_at)} />
        </div>
      </section>

      <section className="mb-4 space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        {real.compte_rendu && <TextBlock title="Compte rendu operatoire" value={real.compte_rendu} />}
        {real.commentaire && <TextBlock title="Commentaire du resident" value={real.commentaire} />}
        {!real.compte_rendu && !real.commentaire && (
          <p className="text-sm text-slate-400">Aucun compte rendu ou commentaire renseigne.</p>
        )}
      </section>

      {lastFeedback?.feedback && (
        <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="mb-1.5 text-xs font-medium text-sky-700">Feedback - {lastFeedback.profiles?.full_name}</p>
          <p className="text-sm text-slate-700">{lastFeedback.feedback}</p>
        </div>
      )}

      {(feedback ?? []).length > 0 && (
        <section className="mb-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Suivi de validation</p>
          <div className="space-y-3">
            {feedback.map((item, index) => (
              <div key={`${item.created_at}-${index}`} className="border-l-2 border-slate-200 pl-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{ACTION_LABELS[item.action] ?? item.action}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(item.created_at)}</p>
                </div>
                <p className="text-xs text-slate-500">{item.profiles?.full_name ?? 'Systeme'}</p>
                {item.feedback && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.feedback}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {canEdit && (
        <Link
          href={`/resident/historique/${id}/modifier`}
          className="block w-full rounded-xl border-2 py-2.5 text-center text-sm font-medium transition hover:bg-slate-50"
          style={{ borderColor: 'var(--color-navy)', color: 'var(--color-navy)' }}
        >
          {real.status === 'pending' ? 'Modifier le geste en attente' : 'Modifier et re-soumettre'}
        </Link>
      )}
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{value ?? '-'}</p>
    </div>
  )
}

function TextBlock({ title, value }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-500">{title}</p>
      <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{value}</p>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
