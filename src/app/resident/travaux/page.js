import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import TravauxClient from './TravauxClient'
import { normalizeTravailTypes } from '@/lib/travaux'

export default async function TravauxPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: travaux }, { data: types }, { data: profile }, { data: enseignants }, { data: residents }] = await Promise.all([
    supabase.from('travaux_scientifiques')
      .select('id, title, journal_or_event, year, authors, doi_or_url, status, validation_status, validation_feedback, type_id, encadrant_id, travail_types(name, color_hex), encadrant:profiles!encadrant_id(id, full_name), travail_auteurs(id, profile_id, external_name, author_order, profiles(id, full_name, role))')
      .eq('resident_id', user.id).order('year', { ascending: false }),
    supabase.from('travail_types').select('id, name, color_hex').eq('is_active', true).order('display_order'),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    admin.from('profiles').select('id, full_name, role').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    admin.from('profiles').select('id, full_name, role').eq('role', 'resident').eq('is_active', true).order('full_name'),
  ])

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <TravauxClient
        initialTravaux={travaux ?? []}
        types={normalizeTravailTypes(types ?? [])}
        residentName={profile?.full_name}
        enseignants={enseignants ?? []}
        residents={residents ?? []}
      />
    </div>
  )
}
