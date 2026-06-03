import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import RealisationDetailView from '@/components/realisations/RealisationDetailView'
import { formatDate } from '@/lib/utils'

export default async function DetailRealisationPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: real }, { data: history }] = await Promise.all([
    supabase
      .from('realisations')
      .select('id, created_at, updated_at, performed_at, activity_type, status, ipp_patient, compte_rendu, commentaire, resident_year_at_time, is_hors_objectifs, procedure_id, enseignant_id, superviseur_resident_id, procedures(id, name, service, pathologie, target_level, target_count, target_year, categories(name, color_hex)), enseignant:profiles!enseignant_id(full_name), profiles!enseignant_id(full_name), superviseur:profiles!superviseur_resident_id(full_name)')
      .eq('id', id)
      .eq('resident_id', user.id)
      .single(),
    admin
      .from('validation_history')
      .select('action, feedback, created_at, profiles!enseignant_id(full_name)')
      .eq('realisation_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!real) notFound()
  const canEdit = real.status === 'pending' || real.status === 'refused'

  return (
    <div className="max-w-2xl p-5 md:p-8">
      <Link href="/resident/historique" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={16} strokeWidth={1.75} />
        Mes actes
      </Link>
      <PageHeader title={real.procedures?.name ?? 'Detail de realisation'} subtitle={formatDate(real.performed_at)} />

      <RealisationDetailView real={real} history={history ?? []} showResident={false} />

      {canEdit && (
        <Link
          href={`/resident/historique/${id}/modifier`}
          className="mt-5 block w-full rounded-xl border-2 py-2.5 text-center text-sm font-medium transition hover:bg-slate-50"
          style={{ borderColor: 'var(--color-navy)', color: 'var(--color-navy)' }}
        >
          {real.status === 'pending' ? 'Modifier le geste en attente' : 'Modifier et re-soumettre'}
        </Link>
      )}
    </div>
  )
}
