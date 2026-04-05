/** Calcule l'année de résidanat (1-5) depuis la date de début */
export function getResidentYear(residanat_start_date) {
  if (!residanat_start_date) return 1
  const start = new Date(residanat_start_date)
  const now = new Date()
  const years = Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000))
  return Math.min(5, Math.max(1, years + 1))
}

/** Formate une date en français */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/** Initiales d'un nom complet */
export function getInitials(fullName) {
  if (!fullName) return '?'
  return fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

/** Libellés des niveaux de participation */
export const PARTICIPATION_LEVELS = {
  1: 'Observation',
  2: 'Aide opératoire',
  3: 'Sous supervision',
  4: 'Autonome',
}

/** Libellés des rôles */
export const ROLE_LABELS = {
  admin: 'Administrateur',
  enseignant: 'Enseignant',
  resident: 'Résident',
}
