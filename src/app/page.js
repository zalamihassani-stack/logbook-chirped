import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ROLE_HOME = {
  admin: '/admin',
  enseignant: '/enseignant',
  resident: '/resident',
}

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (profile?.is_active === false) redirect('/login')
  redirect(ROLE_HOME[profile?.role] ?? '/login')
}
