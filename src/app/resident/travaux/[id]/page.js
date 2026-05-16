import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import TravailDetailView from '@/components/travaux/TravailDetailView'
import TravauxDetailActions from './TravauxDetailActions'
import { normalizeTravailTypes } from '@/lib/travaux'

export default async function TravauxDetailPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: travail }, { data: types }, { data: enseignants }, { data: residents }, { data: history }] = await Promise.all([
    admin.from('travaux_scientifiques')
      .select('id, resident_id, title, journal_or_event, year, authors, doi_or_url, status, validation_status, validation_feedback, initial_validated_by, initial_validated_at, final_validated_at, type_id, encadrant_id, travail_types(name, color_hex), resident:profiles!resident_id(id, full_name, promotion), encadrant:profiles!encadrant_id(id, full_name), travail_auteurs(id, profile_id, external_name, author_order, profiles(id, full_name, role))')
      .eq('id', id)
      .single(),
    supabase.from('travail_types').select('id, name, color_hex').eq('is_active', true).order('display_order'),
    admin.from('profiles').select('id, full_name, role').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    admin.from('profiles').select('id, full_name, role').eq('role', 'resident').eq('is_active', true).order('full_name'),
    admin.from('travail_validation_history')
      .select('id, action, feedback, created_at, enseignant:profiles!enseignant_id(full_name)')
      .eq('travail_id', id)
      .order('created_at', { ascending: true }),
  ])

  const authorEntry = travail?.travail_auteurs?.find((author) => author.profile_id === user.id)
  const canAccess = travail?.resident_id === user.id || Boolean(authorEntry)
  const canManage = travail?.resident_id === user.id
  if (!travail || !canAccess) notFound()

  return (
    <div className="max-w-2xl p-5 md:p-8">
      <Link href="/resident/travaux" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={16} strokeWidth={1.75} />
        Retour
      </Link>

      <PageHeader title={travail.title} subtitle={`${travail.year}`} />

      <div className="mb-4">
        <TravailDetailView travail={travail} history={history ?? []} showResident={false} />
      </div>

      <TravauxDetailActions
        travail={travail}
        types={normalizeTravailTypes(types ?? [])}
        enseignants={enseignants ?? []}
        residents={residents ?? []}
        canManage={canManage}
      />
    </div>
  )
}
