import { normalizeService } from '@/lib/logbook'

export async function getEnseignantDashboardData(supabase, userId, teacherServiceRaw) {
  const teacherService = normalizeService(teacherServiceRaw)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    pendingRes,
    validatedRes,
    refusedRes,
    residentsRes,
    recentRes,
    pendingTravauxRes,
    pendingInitialTravauxRes,
    pendingFinalTravauxRes,
    recentFinalTravauxRes,
    recentTravauxRes,
  ] = await Promise.all([
    supabase.from('realisations').select('id, procedures!inner(service)', { count: 'exact', head: true }).eq('enseignant_id', userId).eq('procedures.service', teacherService).eq('status', 'pending'),
    supabase.from('realisations').select('id, procedures!inner(service)', { count: 'exact', head: true }).eq('enseignant_id', userId).eq('procedures.service', teacherService).eq('status', 'validated').gte('updated_at', startOfMonth),
    supabase.from('realisations').select('id, procedures!inner(service)', { count: 'exact', head: true }).eq('enseignant_id', userId).eq('procedures.service', teacherService).eq('status', 'refused').gte('updated_at', startOfMonth),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'resident').eq('is_active', true),
    supabase.from('realisations')
      .select('id, performed_at, procedures!inner(name, service), profiles!resident_id(full_name)')
      .eq('enseignant_id', userId).eq('status', 'pending')
      .eq('procedures.service', teacherService)
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).eq('encadrant_id', userId).in('validation_status', ['pending_initial', 'pending_final']),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).eq('encadrant_id', userId).eq('validation_status', 'pending_initial'),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).eq('encadrant_id', userId).eq('validation_status', 'pending_final'),
    supabase.from('travaux_scientifiques').select('id, title, year, validation_status, resident:profiles!resident_id(full_name), travail_types(name, color_hex)').eq('encadrant_id', userId).eq('validation_status', 'pending_final').order('year', { ascending: false }).limit(3),
    supabase.from('travaux_scientifiques').select('id, title, year, validation_status, resident:profiles!resident_id(full_name), travail_types(name, color_hex)').eq('encadrant_id', userId).eq('validation_status', 'pending_initial').order('year', { ascending: false }).limit(5),
  ])

  return {
    counts: {
      pending: pendingRes.count ?? 0,
      validated: validatedRes.count ?? 0,
      refused: refusedRes.count ?? 0,
      residents: residentsRes.count ?? 0,
      pendingTravaux: pendingTravauxRes.count ?? 0,
      pendingInitialTravaux: pendingInitialTravauxRes.count ?? 0,
      pendingFinalTravaux: pendingFinalTravauxRes.count ?? 0,
    },
    recentRealisations: recentRes.data ?? [],
    recentFinalTravaux: recentFinalTravauxRes.data ?? [],
    recentTravaux: recentTravauxRes.data ?? [],
  }
}
