import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuiviClient from './SuiviClient'

export default async function SuiviPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    actesMonthRes, actesAttentteRes, residentsRes,
    { data: residents }, { data: procedures }, { data: enseignants },
  ] = await Promise.all([
    supabase.from('realisations').select('*', { count: 'exact', head: true }).gte('performed_at', startOfMonth),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'resident').eq('is_active', true),
    supabase.from('profiles').select('id, full_name, residanat_start_date, promotion').eq('role', 'resident').eq('is_active', true).order('full_name'),
    supabase.from('procedures').select('id, name').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
  ])

  const stats = {
    actesMonth: actesMonthRes.count ?? 0,
    actesAttente: actesAttentteRes.count ?? 0,
    residentsActifs: residentsRes.count ?? 0,
  }

  return (
    <SuiviClient
      stats={stats}
      residents={residents ?? []}
      procedures={procedures ?? []}
      enseignants={enseignants ?? []}
    />
  )
}
