import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import TravauxDetailActions from './TravauxDetailActions'

export default async function TravauxDetailPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: travail }, { data: types }] = await Promise.all([
    supabase.from('travaux_scientifiques')
      .select('id, title, journal_or_event, year, authors, doi_or_url, status, type_id, travail_types(name, color_hex)')
      .eq('id', id).eq('resident_id', user.id).single(),
    supabase.from('travail_types').select('id, name, color_hex').eq('is_active', true).order('display_order'),
  ])

  if (!travail) notFound()

  const STATUS_LABELS = { soumis: 'Soumis', accepte: 'Accepté', publie: 'Publié', presente: 'Présenté' }

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <Link href="/resident/travaux" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft size={16} strokeWidth={1.75} />
        Retour
      </Link>

      <PageHeader title={travail.title} subtitle={`${travail.year}`} />

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {travail.travail_types && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: travail.travail_types.color_hex + '25', color: travail.travail_types.color_hex }}>
              {travail.travail_types.name}
            </span>
          )}
          <Badge status={travail.status} />
        </div>

        {travail.journal_or_event && (
          <Row label="Journal / Congrès" value={travail.journal_or_event} />
        )}
        {travail.authors && (
          <Row label="Auteurs" value={travail.authors} />
        )}
        {travail.doi_or_url && (
          <div className="flex gap-3">
            <span className="text-xs font-medium text-slate-500 w-36 flex-shrink-0 pt-0.5">DOI / URL</span>
            <a href={travail.doi_or_url} target="_blank" rel="noopener noreferrer"
              className="text-sm break-all" style={{ color: '#0D2B4E' }}>
              {travail.doi_or_url}
            </a>
          </div>
        )}
      </div>

      <TravauxDetailActions travail={travail} types={types ?? []} />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-medium text-slate-500 w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  )
}
