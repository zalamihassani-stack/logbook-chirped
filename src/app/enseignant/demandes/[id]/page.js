import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import RealisationDetailView from '@/components/realisations/RealisationDetailView'
import ValidationForm from './ValidationForm'

export default async function ValidationPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: real }, { data: history }] = await Promise.all([
    admin
      .from('realisations')
      .select(`
        id, performed_at, created_at, updated_at, activity_type, ipp_patient, compte_rendu,
        commentaire, status, resident_year_at_time, is_hors_objectifs,
        enseignant_id, resident_id, procedure_id,
        procedures(name, pathologie, categories(name, color_hex)),
        resident:profiles!resident_id(full_name, promotion, residanat_start_date),
        enseignant:profiles!enseignant_id(full_name),
        superviseur:profiles!superviseur_resident_id(full_name)
      `)
      .eq('id', id)
      .single(),
    admin
      .from('validation_history')
      .select('action, feedback, created_at, profiles!enseignant_id(full_name)')
      .eq('realisation_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!real) notFound()
  if (real.enseignant_id !== user.id) notFound()

  const { data: procedureProgress } = await admin
    .from('v_resident_procedure_counts')
    .select('count_expose, count_supervise, count_autonome')
    .eq('resident_id', real.resident_id)
    .eq('procedure_id', real.procedure_id)
    .maybeSingle()

  return (
    <div className="max-w-2xl p-5 md:p-8">
      <Link
        href="/enseignant/demandes"
        className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:shadow-md"
        style={{ color: 'var(--color-navy)' }}
      >
        <ArrowLeft size={16} />
        Retour aux demandes
      </Link>

      <PageHeader title="Validation d'acte" subtitle={real.procedures?.name} />

      <RealisationDetailView real={real} history={history ?? []} procedureProgress={procedureProgress} />

      <div className="mt-5">
        {real.status === 'pending' && <ValidationForm realisationId={id} />}
        {real.status !== 'pending' && (
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 text-center text-sm text-slate-500 shadow-sm">
            Cet acte a deja ete traite.
          </div>
        )}
      </div>
    </div>
  )
}
