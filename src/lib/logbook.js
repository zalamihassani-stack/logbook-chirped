export const ACTIVITY_TYPES = [
  { value: 'expose', label: 'Exposé' },
  { value: 'supervise', label: 'Supervisé' },
  { value: 'autonome', label: 'Autonome' },
]

export const ACTIVITY_TYPE_LABELS = {
  expose: 'Exposé',
  supervise: 'Supervisé',
  autonome: 'Autonome',
}

export const OBJECTIF_LEVEL_LABELS = {
  1: 'Exposition',
  2: 'Sous supervision',
  3: 'Autonomie',
}

export const NIVEAU_ATTEINT_LABELS = {
  0: 'Non débuté',
  1: 'Exposition atteinte',
  2: 'Compétence supervisée atteinte',
  3: 'Maîtrise atteinte',
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

function objectiveKey(objective) {
  return `${objective.procedure_id}-${objective.year ?? 1}-${objective.required_level}`
}

function buildObjective({ procedure, year, requiredLevel, minCount, source = 'derived' }) {
  const normalizedLevel = normalizeObjectifLevel(requiredLevel)
  if (!procedure?.id || !normalizedLevel) return null

  return {
    procedure_id: procedure.id,
    year: normalizedLevel === 1 ? 1 : year,
    required_level: normalizedLevel,
    min_count: minCount || getMinimumForRequiredLevel(procedure, normalizedLevel),
    procedures: procedure,
    source,
    is_transversal: normalizedLevel === 1,
  }
}

export function buildCurriculumObjectives({ procedures = [], objectiveRows = [] }) {
  const procedureById = new Map((procedures ?? []).filter(Boolean).map((procedure) => [procedure.id, procedure]))
  const yearly = []
  const exposureByProcedure = new Map()
  const seenYearly = new Set()

  for (const procedure of procedures ?? []) {
    if (!procedure?.id || normalizeObjectifLevel(procedure.objectif_final) !== 1) continue
    const exposure = buildObjective({
      procedure,
      year: 1,
      requiredLevel: 1,
      minCount: getMinimumForRequiredLevel(procedure, 1),
      source: 'exposure',
    })
    if (exposure) exposureByProcedure.set(procedure.id, exposure)
  }

  for (const row of objectiveRows ?? []) {
    const procedure = row.procedures ?? procedureById.get(row.procedure_id)
    const requiredLevel = normalizeObjectifLevel(row.required_level)
    if (!procedure || requiredLevel < 2) continue

    const objective = buildObjective({
      procedure,
      year: Number.parseInt(row.year, 10),
      requiredLevel,
      minCount: Number.parseInt(row.min_count, 10) || getMinimumForRequiredLevel(procedure, requiredLevel),
      source: 'explicit',
    })
    if (!objective?.year) continue

    const key = objectiveKey(objective)
    if (seenYearly.has(key)) continue
    seenYearly.add(key)
    yearly.push(objective)
  }

  return {
    exposure: Array.from(exposureByProcedure.values()).sort((a, b) => (a.procedures?.name ?? '').localeCompare(b.procedures?.name ?? '')),
    yearly: yearly.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      if (a.required_level !== b.required_level) return b.required_level - a.required_level
      return (a.procedures?.name ?? '').localeCompare(b.procedures?.name ?? '')
    }),
    all: [...Array.from(exposureByProcedure.values()), ...yearly],
  }
}

export function enrichObjectiveProgress(objectives = [], progressIndex = {}) {
  return objectives.map((objective) => {
    const count = getCountForRequiredLevel(progressIndex[objective.procedure_id], objective.required_level)
    const done = count >= objective.min_count
    const pct = objective.min_count ? Math.min(100, Math.round((count / objective.min_count) * 100)) : 0
    return { ...objective, count, done, pct }
  })
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
