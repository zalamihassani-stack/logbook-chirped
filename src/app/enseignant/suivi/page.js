import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuiviClient from './SuiviClient'
import { normalizeService } from '@/lib/logbook'

export default async function SuiviPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: residents }] = await Promise.all([
    supabase
      .from('profiles')
      .select('service')
      .eq('id', user.id)
      .single(),
    supabase
      .from('profiles')
      .select('id, full_name, residanat_start_date, promotion')
      .eq('role', 'resident')
      .eq('is_active', true)
      .order('full_name'),
  ])
  const teacherService = normalizeService(profile?.service)

  return (
    <SuiviClient
      residents={residents ?? []}
      teacherService={teacherService}
    />
  )
}
