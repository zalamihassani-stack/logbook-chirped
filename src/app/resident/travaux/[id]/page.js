import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import TravauxDetailActions from './TravauxDetailActions'
import { formatTravailAuthors, normalizeTravailTypes, TRAVAIL_VALIDATION_LABELS, TRAVAIL_VALIDATION_STYLES } from '@/lib/travaux'

export default async function TravauxDetailPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: travail }, { data: types }, { data: enseignants }, { data: residents }] = await Promise.all([
    supabase.from('travaux_scientifiques')
      .select('id, title, journal_or_event, year, authors, doi_or_url, status, validation_status, validation_feedback, initial_validated_at, final_validated_at, type_id, encadrant_id, travail_types(name, color_hex), encadrant:profiles!encadrant_id(id, full_name), travail_auteurs(id, profile_id, external_name, author_order, profiles(id, full_name, role))')
      .eq('id', id).eq('resident_id', user.id).single(),
    supabase.from('travail_types').select('id, name, color_hex').eq('is_active', true).order('display_order'),
    admin.from('profiles').select('id, full_name, role').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    admin.from('profiles').select('id, full_name, role').eq('role', 'resident').eq('is_active', true).order('full_name'),
  ])

  if (!travail) notFound()
  const validationStyle = TRAVAIL_VALIDATION_STYLES[travail.validation_status] ?? { bg: '#f1f5f9', color: '#64748b' }

  return (
    <div className="max-w-2xl p-5 md:p-8">
      <Link href="/resident/travaux" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={16} strokeWidth={1.75} />
        Retour
      </Link>

      <PageHeader title={travail.title} subtitle={`${travail.year}`} />

      <div className="mb-4 space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {travail.travail_types && (
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${travail.travail_types.color_hex}25`, color: travail.travail_types.color_hex }}>
              {travail.travail_types.name}
            </span>
          )}
          <Badge status={travail.status} />
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: validationStyle.bg, color: validationStyle.color }}>
            {TRAVAIL_VALIDATION_LABELS[travail.validation_status] ?? travail.validation_status}
          </span>
        </div>

        {travail.journal_or_event && <Row label="Journal / Congrès" value={travail.journal_or_event} />}
        {travail.encadrant?.full_name && <Row label="Encadrant" value={travail.encadrant.full_name} />}
        {travail.initial_validated_at && <Row label="Validation initiale" value={new Date(travail.initial_validated_at).toLocaleDateString('fr-FR')} />}
        {travail.final_validated_at && <Row label="Validation définitive" value={new Date(travail.final_validated_at).toLocaleDateString('fr-FR')} />}
        {travail.validation_feedback && <Row label="Feedback" value={travail.validation_feedback} />}
        {formatTravailAuthors(travail) && <Row label="Auteurs" value={formatTravailAuthors(travail)} />}
        {travail.doi_or_url && (
          <div className="flex gap-3">
            <span className="w-36 flex-shrink-0 pt-0.5 text-xs font-medium text-slate-500">DOI / URL</span>
            <a href={travail.doi_or_url} target="_blank" rel="noopener noreferrer"
              className="break-all text-sm" style={{ color: '#0D2B4E' }}>
              {travail.doi_or_url}
            </a>
          </div>
        )}
      </div>

      <TravauxDetailActions
        travail={travail}
        types={normalizeTravailTypes(types ?? [])}
        enseignants={enseignants ?? []}
        residents={residents ?? []}
      />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="w-36 flex-shrink-0 pt-0.5 text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  )
}
