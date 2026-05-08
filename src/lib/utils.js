/** Calcule l'annee de residanat (1-5) depuis la date de debut */
export function getResidentYear(residanat_start_date) {
  if (!residanat_start_date) return 1
  const start = new Date(residanat_start_date)
  const now = new Date()
  const years = Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000))
  return Math.min(5, Math.max(1, years + 1))
}

/** Formate une date en francais */
export function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Initiales d'un nom complet */
export function getInitials(fullName) {
  if (!fullName) return '?'
  return fullName.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase()
}

export { ACTIVITY_TYPE_LABELS, OBJECTIF_LEVEL_LABELS, NIVEAU_ATTEINT_LABELS } from '@/lib/logbook'

export function normalizeObjective(objective) {
  if (!objective) return objective
  if (!objective.required_level) {
    return {
      ...objective,
      min_count: 1,
    }
  }

  return {
    ...objective,
    min_count: 1,
  }
}

export function normalizeObjectives(objectives) {
  return (objectives ?? []).map(normalizeObjective)
}

/** Libelles des roles */
export const ROLE_LABELS = {
  admin: 'Administrateur',
  enseignant: 'Enseignant',
  resident: 'Résident',
}
