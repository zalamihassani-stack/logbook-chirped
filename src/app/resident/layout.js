import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'

export default async function ResidentLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('id, full_name, role').eq('id', user.id).single()

  if (profile?.role !== 'resident') redirect('/')

  // Counts pour badges nav
  const [refusedRes, pendingRes] = await Promise.all([
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'refused'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'pending'),
  ])

  const badges = {
    historique: (refusedRes.count ?? 0) + (pendingRes.count ?? 0),
  }

  return <AppLayout profile={profile} badges={badges}>{children}</AppLayout>
}
