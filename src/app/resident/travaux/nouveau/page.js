import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { normalizeTravailTypes } from '@/lib/travaux'
import NouveauTravailForm from './NouveauTravailForm'

export default async function NouveauTravailPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: types }, { data: enseignants }, { data: residents }] = await Promise.all([
    supabase.from('travail_types').select('id, name, color_hex').eq('is_active', true).order('display_order'),
    admin.from('profiles').select('id, full_name, role').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    admin.from('profiles').select('id, full_name, role').eq('role', 'resident').eq('is_active', true).order('full_name'),
  ])

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <NouveauTravailForm
        types={normalizeTravailTypes(types ?? [])}
        enseignants={enseignants ?? []}
        residents={residents ?? []}
        residentId={user.id}
      />
    </div>
  )
}
