import { getResidentProgressRows } from '@/lib/logbook'

export async function getResidentDashboardData(supabase, admin, userId) {
  const { data: authorLinks } = await admin
    .from('travail_auteurs')
    .select('travail_id')
    .eq('profile_id', userId)
  const authoredIds = Array.from(
    new Set((authorLinks ?? []).map((link) => link.travail_id).filter(Boolean))
  )

  const [
    progressRows,
    proceduresRes,
    totalRes,
    validatedRes,
    pendingRes,
    refusedRes,
    ownTravauxRes,
    authoredTravauxRes,
    typesRes,
  ] = await Promise.all([
    getResidentProgressRows(supabase, userId),
    supabase
      .from('procedures')
      .select('id, objectif_final, target_level, target_count, target_year, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min')
      .eq('is_active', true),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', userId),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', userId).eq('status', 'validated'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', userId).eq('status', 'pending'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', userId).eq('status', 'refused'),
    admin.from('travaux_scientifiques').select('id, type_id, validation_status').eq('resident_id', userId),
    authoredIds.length > 0
      ? admin.from('travaux_scientifiques').select('id, type_id, validation_status').in('id', authoredIds)
      : Promise.resolve({ data: [] }),
    supabase.from('travail_types').select('id, name, color_hex').eq('is_active', true).order('display_order'),
  ])

  return {
    progressRows: progressRows ?? [],
    procedures: proceduresRes.data ?? [],
    counts: {
      total: totalRes.count ?? 0,
      validated: validatedRes.count ?? 0,
      pending: pendingRes.count ?? 0,
      refused: refusedRes.count ?? 0,
    },
    ownTravaux: ownTravauxRes.data ?? [],
    authoredTravaux: authoredTravauxRes.data ?? [],
    travailTypes: typesRes.data ?? [],
    authoredIds,
  }
}
