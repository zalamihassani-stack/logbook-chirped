import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'

export default async function EnseignantLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('id, full_name, role').eq('id', user.id).single()

  if (profile?.role !== 'enseignant') redirect('/')

  const { count: pendingCount } = await supabase
    .from('realisations')
    .select('*', { count: 'exact', head: true })
    .eq('enseignant_id', user.id)
    .eq('status', 'pending')

  return <AppLayout profile={profile} badges={{ demandes: pendingCount ?? 0 }}>{children}</AppLayout>
}
