export const ACTIVITY_TYPES = [
  { value: 'expose', label: 'Expose' },
  { value: 'supervise', label: 'Supervise' },
  { value: 'autonome', label: 'Autonome' },
]

export const ACTIVITY_TYPE_LABELS = {
  expose: 'Expose',
  supervise: 'Supervise',
  autonome: 'Autonome',
}

export const OBJECTIF_LEVEL_LABELS = {
  1: 'Exposition',
  2: 'Sous supervision',
  3: 'Autonomie',
}

export const NIVEAU_ATTEINT_LABELS = {
  0: 'Non debute',
  1: 'Exposition atteinte',
  2: 'Competence supervisee atteinte',
  3: 'Maitrise atteinte',
}

export function normalizeObjectifLevel(value) {
  const parsed = Number.parseInt(value, 10)
  return parsed >= 1 && parsed <= 3 ? parsed : 0
}

export function groupObjectivesByYear(objectives) {
  const grouped = {}

  for (const objective of objectives ?? []) {
    if (!objective?.year) continue
    if (!grouped[objective.year]) grouped[objective.year] = []
    grouped[objective.year].push(objective)
  }

  return grouped
}

export function indexProgressByProcedure(progressRows) {
  const index = {}

  for (const row of progressRows ?? []) {
    if (!row?.procedure_id) continue
    index[row.procedure_id] = row
  }

  return index
}

export function getCountForRequiredLevel(progressRow, requiredLevel) {
  if (!progressRow) return 0

  const expose = progressRow.count_expose ?? 0
  const supervise = progressRow.count_supervise ?? 0
  const autonome = progressRow.count_autonome ?? 0

  if (requiredLevel === 1) return expose + supervise + autonome
  if (requiredLevel === 2) return supervise + autonome
  if (requiredLevel === 3) return autonome
  return 0
}

export function getMinimumForRequiredLevel(procedure, requiredLevel) {
  if (!procedure) return 1

  if (requiredLevel === 1) return Math.max(1, procedure.seuil_exposition_min ?? 1)
  if (requiredLevel === 2) return Math.max(1, procedure.seuil_supervision_min ?? 1)
  if (requiredLevel === 3) return Math.max(1, procedure.seuil_autonomie_min ?? procedure.seuil_deblocage_autonomie ?? 1)
  return 1
}

export function procedureToGlobalObjective(procedure) {
  const requiredLevel = normalizeObjectifLevel(procedure?.objectif_final)

  return {
    procedure_id: procedure?.id,
    procedures: procedure,
    required_level: requiredLevel,
    min_count: getMinimumForRequiredLevel(procedure, requiredLevel),
    is_global_objective: true,
  }
}

export async function getResidentProgressRows(supabase, residentId) {
  const { data, error } = await supabase.rpc('get_resident_progress', {
    p_resident_id: residentId,
  })

  if (error) throw error
  return data ?? []
}

export async function getAutonomeSubmissionGuard(supabase, residentId, procedureId) {
  const [{ data: allowed, error: rpcError }, { data: progressRow, error: progressError }, { data: procedure, error: procedureError }] = await Promise.all([
    supabase.rpc('can_submit_autonome', {
      p_resident_id: residentId,
      p_procedure_id: procedureId,
    }),
    supabase
      .from('v_resident_niveau')
      .select('count_supervise')
      .eq('resident_id', residentId)
      .eq('procedure_id', procedureId)
      .maybeSingle(),
    supabase
      .from('procedures')
      .select('seuil_deblocage_autonomie')
      .eq('id', procedureId)
      .single(),
  ])

  if (rpcError) throw rpcError
  if (progressError) throw progressError
  if (procedureError) throw procedureError

  const countSupervise = progressRow?.count_supervise ?? 0
  const threshold = procedure?.seuil_deblocage_autonomie ?? 0
  const missingSuperviseCount = Math.max(0, threshold - countSupervise)

  return {
    allowed: Boolean(allowed),
    missingSuperviseCount,
    countSupervise,
    threshold,
  }
}
