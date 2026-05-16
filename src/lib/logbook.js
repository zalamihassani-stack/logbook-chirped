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

  if (procedure.target_count) return Math.max(1, procedure.target_count)
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

export function procedureToTargetObjective(procedure) {
  const targetLevel = normalizeObjectifLevel(procedure?.target_level) || normalizeObjectifLevel(procedure?.objectif_final)
  if (!procedure?.id || !targetLevel) return null

  const fallbackYear = targetLevel === 1 ? 1 : undefined
  const parsedYear = Number.parseInt(procedure.target_year, 10)
  const year = parsedYear >= 1 && parsedYear <= 5 ? parsedYear : fallbackYear
  const minCount = Number.parseInt(procedure.target_count, 10) || getMinimumForRequiredLevel(procedure, targetLevel)

  if (!year) return null

  return buildObjective({
    procedure,
    year,
    requiredLevel: targetLevel,
    minCount,
    source: procedure.target_level ? 'target' : 'legacy',
  })
}

function hasSimplifiedTargets(procedures = []) {
  return procedures.some((procedure) => procedure?.target_level || procedure?.target_count || procedure?.target_year)
}

export function buildCurriculumObjectives({ procedures = [], objectiveRows = [] }) {
  if (hasSimplifiedTargets(procedures)) {
    const all = (procedures ?? [])
      .map(procedureToTargetObjective)
      .filter(Boolean)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        if (a.required_level !== b.required_level) return b.required_level - a.required_level
        return (a.procedures?.name ?? '').localeCompare(b.procedures?.name ?? '')
      })

    return {
      exposure: all.filter((objective) => objective.required_level === 1),
      yearly: all.filter((objective) => objective.required_level !== 1),
      all,
    }
  }

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
  const targetObjective = procedureToTargetObjective(procedure)
  if (targetObjective) return { ...targetObjective, is_global_objective: true }

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
