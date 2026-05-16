import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import TravauxClient from './TravauxClient'
import { normalizeTravailTypes } from '@/lib/travaux'

export default async function TravauxPage({ searchParams }) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const params = await searchParams

  const { data: authorLinks } = await admin
    .from('travail_auteurs')
    .select('travail_id')
    .eq('profile_id', user.id)
  const authoredIds = Array.from(new Set((authorLinks ?? []).map((link) => link.travail_id).filter(Boolean)))
  const travauxSelect = 'id, resident_id, title, journal_or_event, year, authors, doi_or_url, status, validation_status, validation_feedback, type_id, encadrant_id, travail_types(name, color_hex), encadrant:profiles!encadrant_id(id, full_name), travail_auteurs(id, profile_id, external_name, author_order, profiles(id, full_name, role))'

  const [{ data: ownTravaux }, authoredTravauxRes, { data: types }, { data: profile }, { data: enseignants }] = await Promise.all([
    admin.from('travaux_scientifiques')
      .select(travauxSelect)
      .eq('resident_id', user.id).order('year', { ascending: false }),
    authoredIds.length > 0
      ? admin.from('travaux_scientifiques')
        .select(travauxSelect)
        .in('id', authoredIds).order('year', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from('travail_types').select('id, name, color_hex').eq('is_active', true).order('display_order'),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    admin.from('profiles').select('id, full_name, role').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
  ])
  const travaux = Array.from(new Map([...(ownTravaux ?? []), ...(authoredTravauxRes.data ?? [])].map((travail) => [travail.id, travail])).values())
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <TravauxClient
        initialTravaux={travaux}
        types={normalizeTravailTypes(types ?? [])}
        residentName={profile?.full_name}
        residentId={user.id}
        enseignants={enseignants ?? []}
        initialType={typeof params?.type === 'string' ? params.type : 'all'}
        initialValidation={typeof params?.validation === 'string' ? params.validation : 'all'}
      />
    </div>
  )
}
