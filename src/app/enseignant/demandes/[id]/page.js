import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import ValidationForm from './ValidationForm'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDate, PARTICIPATION_LEVELS } from '@/lib/utils'

export default async function ValidationPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Admin client pour bypasser RLS sur realisations et profiles
  const { data: real } = await admin
    .from('realisations')
    .select(`
      id, performed_at, participation_level, ipp_patient, compte_rendu,
      commentaire, status, resident_year_at_time, is_hors_objectifs,
      enseignant_id,
      procedures(name, pathologie),
      resident:profiles!resident_id(full_name),
      superviseur:profiles!superviseur_resident_id(full_name)
    `)
    .eq('id', id)
    .single()

  if (!real) notFound()

  // Vérifier que l'enseignant connecté est bien le superviseur de cet acte
  if (real.enseignant_id !== user.id) notFound()

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <PageHeader title="Validation d'acte" subtitle={real.procedures?.name} />

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-5 space-y-3">
        <Row label="Résident" value={real.resident?.full_name} />
        <Row label="Geste" value={real.procedures?.name} />
        {real.procedures?.pathologie && <Row label="Pathologie" value={real.procedures.pathologie} />}
        <Row label="Date" value={formatDate(real.performed_at)} />
        <Row label="Niveau déclaré" value={PARTICIPATION_LEVELS[real.participation_level]} />
        <Row label="Année résidanat" value={`Année ${real.resident_year_at_time}`} />
        {real.ipp_patient && <Row label="IPP patient" value={real.ipp_patient} />}
        {real.superviseur?.full_name && (
          <Row label="Résident superviseur" value={real.superviseur.full_name} />
        )}
        {real.is_hors_objectifs && (
          <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-700">
            Geste hors objectifs annuels
          </div>
        )}
        {real.compte_rendu && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Compte rendu opératoire</p>
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
          Cet acte a déjà été traité.
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
