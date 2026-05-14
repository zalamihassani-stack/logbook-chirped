import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuiviClient from './SuiviClient'

export default async function SuiviPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: residents }, { data: procedures }, { data: enseignants },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, residanat_start_date, promotion').eq('role', 'resident').eq('is_active', true).order('full_name'),
    supabase.from('procedures').select('id, name').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
  ])

  return (
    <SuiviClient
      residents={residents ?? []}
      procedures={procedures ?? []}
      enseignants={enseignants ?? []}
    />
  )
}
