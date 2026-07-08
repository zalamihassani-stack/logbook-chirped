import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import ErrorBoundary from '@/components/ErrorBoundary'
import { normalizeService } from '@/lib/logbook'

export default async function EnseignantLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('id, full_name, role, service, is_active').eq('id', user.id).single()

  if (profile?.role !== 'enseignant' || profile?.is_active === false) redirect('/')
  const teacherService = normalizeService(profile?.service)

  const [pendingRes, pendingTravauxRes] = await Promise.all([
    supabase
      .from('realisations')
      .select('id, procedures!inner(service)', { count: 'exact', head: true })
      .eq('enseignant_id', user.id)
      .eq('procedures.service', teacherService)
      .eq('status', 'pending'),
    supabase
      .from('travaux_scientifiques')
      .select('*', { count: 'exact', head: true })
      .eq('encadrant_id', user.id)
      .in('validation_status', ['pending_initial', 'pending_final']),
  ])

  return <AppLayout profile={profile} badges={{ demandes: pendingRes.count ?? 0, travaux: pendingTravauxRes.count ?? 0 }}><ErrorBoundary>{children}</ErrorBoundary></AppLayout>
}
