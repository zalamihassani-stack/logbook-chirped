import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import TravailDetailView from '@/components/travaux/TravailDetailView'
import TravailValidationPanel from './TravailValidationPanel'
import { isPendingTravailValidation } from '@/lib/travaux'

export default async function EnseignantTravailDetailPage({ params, searchParams }) {
  const { id } = await params
  const query = await searchParams
  const backHref = query?.from === 'suivi' ? '/enseignant/suivi' : '/enseignant/travaux'
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: travail }, { data: history }] = await Promise.all([
    admin.from('travaux_scientifiques')
      .select('id, resident_id, title, journal_or_event, year, authors, doi_or_url, status, validation_status, validation_feedback, initial_validated_by, initial_validated_at, final_validated_by, final_validated_at, type_id, encadrant_id, resident:profiles!resident_id(id, full_name, promotion), encadrant:profiles!encadrant_id(id, full_name), travail_types(name, color_hex), travail_auteurs(id, profile_id, external_name, author_order, profiles(id, full_name, role))')
      .eq('id', id)
      .maybeSingle(),
    admin.from('travail_validation_history')
      .select('id, action, feedback, created_at, enseignant:profiles!enseignant_id(full_name)')
      .eq('travail_id', id)
      .order('created_at', { ascending: true }),
  ])

  const isAuthor = travail?.travail_auteurs?.some((author) => author.profile_id === user.id)
  const isEncadrant = travail?.encadrant_id === user.id
  if (!travail || (!isAuthor && !isEncadrant)) notFound()

  const canValidate = isEncadrant && isPendingTravailValidation(travail.validation_status)

  return (
    <div className="max-w-3xl p-5 md:p-8">
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={16} strokeWidth={1.75} />
        Retour aux travaux
      </Link>

      <PageHeader title={travail.title} subtitle={`${travail.resident?.full_name ?? 'Résident'} - ${travail.year}`} />

      <div className="space-y-4">
        <TravailDetailView travail={travail} history={history ?? []} />
        {canValidate && <TravailValidationPanel travail={travail} />}
      </div>
    </div>
  )
}
