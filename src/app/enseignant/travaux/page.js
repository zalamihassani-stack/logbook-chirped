import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import TravauxTab from '../suivi/TravauxTab'
import PageHeader from '@/components/ui/PageHeader'
import { normalizeTravailTypes } from '@/lib/travaux'

export default async function EnseignantTravauxPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: residents }, { data: enseignants }, { data: travailTypes }] = await Promise.all([
    admin.from('profiles').select('id, full_name, role').eq('role', 'resident').eq('is_active', true).order('full_name'),
    admin.from('profiles').select('id, full_name, role').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    supabase.from('travail_types').select('id, name, color_hex').eq('is_active', true).order('display_order'),
  ])

  return (
    <div className="max-w-6xl p-5 md:p-8">
      <PageHeader
        title="Travaux scientifiques"
        subtitle="Recherche par auteur, année, type, statut et encadrant"
      />
      <TravauxTab
        residents={residents ?? []}
        enseignants={enseignants ?? []}
        travailTypes={normalizeTravailTypes(travailTypes ?? [])}
      />
    </div>
  )
}
