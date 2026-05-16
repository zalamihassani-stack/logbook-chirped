import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ModifierActeForm from './ModifierActeForm'

export default async function ModifierActePage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: real }, { data: enseignants }, { data: residents }] = await Promise.all([
    supabase
      .from('realisations')
      .select('id, performed_at, activity_type, status, ipp_patient, compte_rendu, commentaire, procedure_id, enseignant_id, superviseur_resident_id, procedures(name)')
      .eq('id', id)
      .eq('resident_id', user.id)
      .single(),
    admin.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    admin.from('profiles').select('id, full_name').eq('role', 'resident').eq('is_active', true).neq('id', user.id).order('full_name'),
  ])

  if (!real) notFound()
  if (real.status !== 'pending' && real.status !== 'refused') redirect(`/resident/historique/${id}`)

  return (
    <div className="max-w-2xl p-5 md:p-8">
      <Link href={`/resident/historique/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={16} strokeWidth={1.75} />
        Détail de l&apos;acte
      </Link>
      <p className="mb-5 text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>
        {real.status === 'pending' ? 'Modifier le geste en attente' : 'Modifier et re-soumettre'}
      </p>
      <ModifierActeForm
        realisationId={id}
        current={real}
        enseignants={enseignants ?? []}
        residents={residents ?? []}
      />
    </div>
  )
}
