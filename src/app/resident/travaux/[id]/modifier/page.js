import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { normalizeTravailTypes } from '@/lib/travaux'
import ModifierTravailForm from './ModifierTravailForm'

export default async function ModifierTravailPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: travail }, { data: types }, { data: enseignants }, { data: residents }] = await Promise.all([
    admin.from('travaux_scientifiques')
      .select('id, resident_id, title, journal_or_event, year, doi_or_url, status, type_id, encadrant_id, travail_types(name, color_hex), travail_auteurs(id, profile_id, external_name, author_order, profiles(id, full_name, role))')
      .eq('id', id).single(),
    supabase.from('travail_types').select('id, name, color_hex').eq('is_active', true).order('display_order'),
    admin.from('profiles').select('id, full_name, role').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    admin.from('profiles').select('id, full_name, role').eq('role', 'resident').eq('is_active', true).order('full_name'),
  ])

  if (!travail || travail.resident_id !== user.id) notFound()

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <ModifierTravailForm
        travail={travail}
        types={normalizeTravailTypes(types ?? [])}
        enseignants={enseignants ?? []}
        residents={residents ?? []}
      />
    </div>
  )
}
