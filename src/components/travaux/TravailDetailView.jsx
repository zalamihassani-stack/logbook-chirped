import { ExternalLink } from 'lucide-react'
import AppCard from '@/components/ui/AppCard'
import DetailRow from '@/components/ui/DetailRow'
import {
  formatTravailAuthors,
  TRAVAIL_STATUS_LABELS,
  TRAVAIL_STATUS_STYLES,
  TRAVAIL_VALIDATION_LABELS,
  TRAVAIL_VALIDATION_STYLES,
} from '@/lib/travaux'

const HISTORY_LABELS = {
  submitted: 'Soumission initiale',
  resubmitted: 'Nouvelle soumission',
  initial_validated: 'Validation initiale',
  pending_final: 'Soumission finale',
  final_validated: 'Validation finale',
  refused: 'Corrections demandees',
}

export default function TravailDetailView({ travail, history = [], showResident = true }) {
  const statusStyle = TRAVAIL_STATUS_STYLES[travail.status] ?? { bg: '#f1f5f9', color: '#64748b' }
  const validationStyle = TRAVAIL_VALIDATION_STYLES[travail.validation_status] ?? { bg: '#f1f5f9', color: '#64748b' }
  const typeColor = travail.travail_types?.color_hex ?? 'var(--color-navy)'
  const timeline = buildTimeline(travail, history)

  return (
    <div className="space-y-4">
      <AppCard className="p-4 sm:p-5">
        <SectionTitle title="Travail" />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {travail.travail_types && (
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: `${typeColor}20`, color: typeColor }}>
              {travail.travail_types.name}
            </span>
          )}
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
            {TRAVAIL_STATUS_LABELS[travail.status] ?? travail.status}
          </span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: validationStyle.bg, color: validationStyle.color }}>
            {TRAVAIL_VALIDATION_LABELS[travail.validation_status] ?? travail.validation_status}
          </span>
        </div>

        <div className="space-y-2.5">
          <DetailRow label="Titre" value={travail.title} />
          <DetailRow label="Type" value={travail.travail_types?.name} />
          {showResident && <DetailRow label="Résident" value={travail.resident?.full_name} />}
          {showResident && <DetailRow label="Promotion" value={travail.resident?.promotion} />}
          <DetailRow label="Encadrant" value={travail.encadrant?.full_name} />
          <DetailRow label="Année" value={String(travail.year)} />
          <DetailRow label="Journal / Congrès" value={travail.journal_or_event} />
          <DetailRow label="Statut" value={TRAVAIL_STATUS_LABELS[travail.status] ?? travail.status} />
          <DetailRow label="Validation" value={TRAVAIL_VALIDATION_LABELS[travail.validation_status] ?? travail.validation_status} />
        </div>

        {travail.doi_or_url && (
          <a
            href={travail.doi_or_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium"
            style={{ color: 'var(--color-navy)' }}
          >
            DOI / URL
            <ExternalLink size={14} strokeWidth={1.8} />
          </a>
        )}
      </AppCard>

      <AppCard className="p-4 sm:p-5">
        <SectionTitle title="Auteurs" />
        <p className="text-sm leading-relaxed text-slate-800">{formatTravailAuthors(travail) || 'Aucun auteur renseigné'}</p>
      </AppCard>

      <AppCard className="p-4 sm:p-5">
        <SectionTitle title="Historique des validations" />
        {timeline.length > 0 ? (
          <div className="space-y-3">
            {timeline.map((item, index) => (
              <div key={`${item.label}-${item.date ?? index}`} className="rounded-xl bg-slate-50 px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  {item.date && <p className="flex-shrink-0 text-xs text-slate-400">{formatDate(item.date)}</p>}
                </div>
                {item.actor && <p className="mt-0.5 text-xs text-slate-500">{item.actor}</p>}
                {item.feedback && <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.feedback}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Aucun evenement de validation pour le moment.</p>
        )}
      </AppCard>
    </div>
  )
}

function SectionTitle({ title }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
  )
}

function buildTimeline(travail, history) {
  const rows = (history ?? []).map((item) => ({
    label: HISTORY_LABELS[item.action] ?? item.action,
    date: item.created_at,
    actor: item.enseignant?.full_name,
    feedback: item.feedback,
  }))

  if (rows.length > 0) return rows

  const fallback = []
  if (travail.initial_validated_at) {
    fallback.push({ label: 'Validation initiale', date: travail.initial_validated_at })
  }
  if (travail.validation_status === 'pending_final') {
    fallback.push({ label: 'Soumission finale', feedback: 'En attente de validation finale.' })
  }
  if (travail.final_validated_at) {
    fallback.push({ label: 'Validation finale', date: travail.final_validated_at })
  }
  if (travail.validation_feedback) {
    fallback.push({ label: 'Feedback', feedback: travail.validation_feedback })
  }
  return fallback
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}
