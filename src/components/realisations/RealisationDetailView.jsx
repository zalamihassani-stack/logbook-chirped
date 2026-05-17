import Badge from '@/components/ui/Badge'
import Section from '@/components/ui/Section'
import DetailRow from '@/components/ui/DetailRow'
import { formatDate, getResidentYear } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'

const ACTION_LABELS = {
  submitted: 'Soumis',
  resubmitted: 'Renvoyé',
  validated: 'Validé',
  refused: 'Refusé',
}

export default function RealisationDetailView({ real, history = [], procedureProgress, showResident = true }) {
  const procedure = real.procedures
  const category = procedure?.categories
  const residentYear = real.resident?.residanat_start_date
    ? getResidentYear(real.resident.residanat_start_date)
    : real.resident_year_at_time

  return (
    <div className="space-y-4">
      <Section title="Geste chirurgical">
        <DetailRow label="Intitulé" value={procedure?.name} />
        <DetailRow label="Pathologie" value={procedure?.pathologie} />
        {category && (
          <DetailRow label="Catégorie">
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${category.color_hex}25`, color: category.color_hex }}
            >
              {category.name}
            </span>
          </DetailRow>
        )}
      </Section>

      {showResident && (
        <Section title="Résident">
          <DetailRow label="Nom" value={real.resident?.full_name} />
          <DetailRow label="Année actuelle" value={residentYear ? `A${residentYear}` : '-'} />
          <DetailRow label="Promotion" value={real.resident?.promotion} />
          <DetailRow label="Année au moment de l'acte" value={real.resident_year_at_time ? `A${real.resident_year_at_time}` : '-'} />
        </Section>
      )}

      <Section title="Détails de l'acte">
        <DetailRow label="Date de réalisation" value={formatDate(real.performed_at)} />
        <DetailRow label="Type d'activité" value={ACTIVITY_TYPE_LABELS[real.activity_type] ?? '-'} />
        <DetailRow label="IPP patient" value={real.ipp_patient} />
        <DetailRow label="Encadrant" value={real.enseignant?.full_name ?? real.profiles?.full_name} />
        <DetailRow label="Résident superviseur" value={real.superviseur?.full_name} />
        <DetailRow label="Soumis le" value={formatDateTime(real.created_at)} />
        <DetailRow label="Dernière modification" value={formatDateTime(real.updated_at)} />
        {real.is_hors_objectifs && (
          <DetailRow label="Objectifs">
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">Hors objectifs</span>
          </DetailRow>
        )}
      </Section>

      {procedureProgress && (
        <Section title="Historique sur ce geste">
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniCount label="Exposé" value={procedureProgress.count_expose ?? 0} />
            <MiniCount label="Supervisé" value={procedureProgress.count_supervise ?? 0} />
            <MiniCount label="Autonome" value={procedureProgress.count_autonome ?? 0} />
          </div>
        </Section>
      )}

      <Section title="Contenu">
        {real.compte_rendu && <TextBlock title="Compte rendu opératoire" value={real.compte_rendu} />}
        {real.commentaire && <TextBlock title="Commentaire du résident" value={real.commentaire} />}
        {!real.compte_rendu && !real.commentaire && (
          <p className="text-sm text-slate-400">Aucun compte rendu ou commentaire renseigné.</p>
        )}
      </Section>

      <Section title="Statut">
        <DetailRow label="Statut actuel"><Badge status={real.status} /></DetailRow>
        <DetailRow label="Enseignant responsable" value={real.enseignant?.full_name ?? real.profiles?.full_name} />
      </Section>

      {history.length > 0 && (
        <Section title="Suivi de validation">
          <div className="space-y-3">
            {history.map((item, index) => (
              <div key={`${item.created_at}-${index}`} className="border-l-2 border-slate-200 pl-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{ACTION_LABELS[item.action] ?? item.action}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(item.created_at)}</p>
                </div>
                  <p className="text-xs text-slate-500">{item.profiles?.full_name ?? 'Système'}</p>
                {item.feedback && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.feedback}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function MiniCount({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <p className="text-lg font-bold" style={{ color: 'var(--color-navy)' }}>{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}

function TextBlock({ title, value }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-500">{title}</p>
      <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{value}</p>
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
