export const FALLBACK_TRAVAIL_TYPES = [
  { id: 'article', key: 'article', name: 'Article', color_hex: 'var(--color-navy)' },
  { id: 'communication_orale', key: 'communication_orale', name: 'Communication orale', color_hex: 'var(--color-success)' },
  { id: 'communication_affichee', key: 'communication_affichee', name: 'Communication affichée', color_hex: 'var(--color-warning)' },
]

export const ARTICLE_STATUS_OPTIONS = [
  { value: 'en_cours', label: "En cours d'écriture" },
  { value: 'soumis', label: 'Soumis' },
  { value: 'accepte', label: 'Accepté' },
  { value: 'publie', label: 'Publié' },
]

export const COMMUNICATION_STATUS_OPTIONS = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'soumis', label: 'Soumis' },
  { value: 'accepte', label: 'Accepté' },
  { value: 'presente', label: 'Présenté' },
]

export const ALL_TRAVAIL_STATUS_OPTIONS = [
  ...ARTICLE_STATUS_OPTIONS,
  ...COMMUNICATION_STATUS_OPTIONS.filter((item) => !ARTICLE_STATUS_OPTIONS.some((status) => status.value === item.value)),
]

export const TRAVAIL_STATUS_LABELS = Object.fromEntries(ALL_TRAVAIL_STATUS_OPTIONS.map((item) => [item.value, item.label]))

export const TRAVAIL_STATUS_STYLES = {
  en_cours: { bg: 'var(--color-ice)', color: 'var(--color-navy)' },
  soumis: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  accepte: { bg: 'var(--color-info-light)', color: 'var(--color-info)' },
  publie: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
  presente: { bg: '#f3e8ff', color: '#6b21a8' },
}

export const FINAL_WORK_STATUSES = ['publie', 'presente']

export const TRAVAIL_VALIDATION_LABELS = {
  pending_initial: 'Validation initiale à faire',
  initial_validated: 'Validation initiale faite',
  pending_final: 'Validation finale à faire',
  final_validated: 'Validation finale faite',
  refused: 'Corrections demandées',
}

export const TRAVAIL_VALIDATION_STYLES = {
  pending_initial: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  initial_validated: { bg: 'var(--color-info-light)', color: 'var(--color-info)' },
  pending_final: { bg: '#ffedd5', color: '#9a3412' },
  final_validated: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
  refused: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
}

export function isFinalWorkStatus(status) {
  return FINAL_WORK_STATUSES.includes(status)
}

export function isPendingTravailValidation(status) {
  return status === 'pending_initial' || status === 'pending_final'
}

export function getTravailValidationActionLabel(status) {
  return status === 'pending_final' ? 'Valider final' : 'Valider initial'
}

export function getTravailValidationHelp(status) {
  if (status === 'pending_initial') return "Le travail attend la première validation de l'encadrant."
  if (status === 'initial_validated') return 'Le travail est validé au stade initial. Une validation finale sera demandée quand il sera publié ou présenté.'
  if (status === 'pending_final') return "Le travail est terminé et attend la validation finale de l'encadrant."
  if (status === 'final_validated') return 'Le travail est validé définitivement.'
  if (status === 'refused') return 'Des corrections ont été demandées. Modifiez puis enregistrez pour renvoyer en validation.'
  return ''
}

export function normalizeTravailTypeName(name = '') {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function getTravailTypeKey(type) {
  const normalized = normalizeTravailTypeName(type?.name ?? type?.key ?? type?.id ?? '')
  if (normalized.includes('article')) return 'article'
  if (normalized.includes('orale')) return 'communication_orale'
  if (normalized.includes('affiche') || normalized.includes('poster')) return 'communication_affichee'
  return 'article'
}

export function getStatusOptionsForType(type) {
  return getTravailTypeKey(type) === 'article' ? ARTICLE_STATUS_OPTIONS : COMMUNICATION_STATUS_OPTIONS
}

export function normalizeTravailTypes(types = []) {
  if (types.length > 0) {
    return types.map((type) => ({ ...type, key: getTravailTypeKey(type) }))
  }
  return FALLBACK_TRAVAIL_TYPES
}

export function formatTravailAuthors(travail) {
  const structured = (travail?.travail_auteurs ?? [])
    .slice()
    .sort((a, b) => (a.author_order ?? 0) - (b.author_order ?? 0))
    .map((author) => author.profiles?.full_name ?? author.external_name)
    .filter(Boolean)

  if (structured.length > 0) return structured.join(', ')
  return travail?.authors ?? ''
}

export function getTravailAuthorsByPosition(travail) {
  const authors = (travail?.travail_auteurs ?? [])
    .slice()
    .sort((a, b) => (a.author_order ?? 0) - (b.author_order ?? 0))
    .map((author) => author.profiles?.full_name ?? author.external_name)
    .filter(Boolean)

  return {
    first: authors[0] ?? '',
    second: authors[1] ?? '',
    others: authors.slice(2),
  }
}
