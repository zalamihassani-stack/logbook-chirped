import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import ValidationForm from './ValidationForm'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'

export default async function ValidationPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: real } = await admin
    .from('realisations')
    .select(`
      id, performed_at, activity_type, ipp_patient, compte_rendu,
      commentaire, status, resident_year_at_time, is_hors_objectifs,
      enseignant_id, resident_id, procedure_id,
      procedures(name, pathologie, seuil_deblocage_autonomie),
      resident:profiles!resident_id(full_name),
      superviseur:profiles!superviseur_resident_id(full_name)
    `)
    .eq('id', id)
    .single()

  if (!real) notFound()
  if (real.enseignant_id !== user.id) notFound()

  const { data: procedureProgress } = await admin
    .from('v_resident_procedure_counts')
    .select('count_expose, count_supervise, count_autonome')
    .eq('resident_id', real.resident_id)
    .eq('procedure_id', real.procedure_id)
    .maybeSingle()

  let autonomyWarning = ''
  if (real.activity_type === 'autonome') {
    const supervisedCount = procedureProgress?.count_supervise ?? 0
    const threshold = real.procedures?.seuil_deblocage_autonomie ?? 0
    const missing = Math.max(0, threshold - supervisedCount)
    if (missing > 0) {
      autonomyWarning = `Pré-requis autonomie non atteint : ${supervisedCount}/${threshold} acte(s) supervisé(s), ${missing} restant(s). La validation reste possible.`
    }
  }

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <PageHeader title="Validation d'acte" subtitle={real.procedures?.name} />

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-5 space-y-3">
        <Row label="Resident" value={real.resident?.full_name} />
        <Row label="Geste" value={real.procedures?.name} />
        {real.procedures?.pathologie && <Row label="Pathologie" value={real.procedures.pathologie} />}
        <Row label="Date" value={formatDate(real.performed_at)} />
        <Row label="Type d'activite" value={ACTIVITY_TYPE_LABELS[real.activity_type] ?? '-'} />
        <Row label="Annee residanat" value={`Annee ${real.resident_year_at_time}`} />
        {real.ipp_patient && <Row label="IPP patient" value={real.ipp_patient} />}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="mb-2 text-xs font-medium text-slate-500">Historique validé sur ce geste</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniCount label="Exposé" value={procedureProgress?.count_expose ?? 0} />
            <MiniCount label="Supervisé" value={procedureProgress?.count_supervise ?? 0} />
            <MiniCount label="Autonome" value={procedureProgress?.count_autonome ?? 0} />
          </div>
        </div>
        {real.superviseur?.full_name && (
          <Row label="Resident superviseur" value={real.superviseur.full_name} />
        )}
        {real.is_hors_objectifs && (
          <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-700">
            Geste hors objectifs annuels
          </div>
        )}
        {autonomyWarning && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            {autonomyWarning}
          </div>
        )}
        {real.compte_rendu && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Compte rendu operatoire</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{real.compte_rendu}</p>
          </div>
        )}
        {real.commentaire && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Commentaire</p>
            <p className="text-sm text-slate-700">{real.commentaire}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-slate-500">Statut actuel</p>
          <Badge status={real.status} />
        </div>
      </div>

      {real.status === 'pending' && <ValidationForm realisationId={id} />}
      {real.status !== 'pending' && (
        <div className="text-center text-sm text-slate-500 py-4">
          Cet acte a deja ete traite.
        </div>
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

function MiniCount({ label, value }) {
  return (
    <div className="rounded-lg bg-white px-2 py-2">
      <p className="text-lg font-bold" style={{ color: 'var(--color-navy)' }}>{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}
