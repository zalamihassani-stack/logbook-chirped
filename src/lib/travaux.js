export const FALLBACK_TRAVAIL_TYPES = [
  { id: 'article', key: 'article', name: 'Article', color_hex: '#0D2B4E' },
  { id: 'communication_orale', key: 'communication_orale', name: 'Communication orale', color_hex: '#166534' },
  { id: 'communication_affichee', key: 'communication_affichee', name: 'Communication affichée', color_hex: '#854d0e' },
]

export const ARTICLE_STATUS_OPTIONS = [
  { value: 'ecriture', label: "En cours d'écriture" },
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
  ecriture: { bg: '#E8F4FC', color: '#0D2B4E' },
  en_cours: { bg: '#E8F4FC', color: '#0D2B4E' },
  soumis: { bg: '#fef9c3', color: '#854d0e' },
  accepte: { bg: '#dbeafe', color: '#1e40af' },
  publie: { bg: '#dcfce7', color: '#166534' },
  presente: { bg: '#f3e8ff', color: '#6b21a8' },
}

export const FINAL_WORK_STATUSES = ['publie', 'presente']

export const TRAVAIL_VALIDATION_LABELS = {
  pending_initial: 'À valider',
  initial_validated: 'Validation initiale faite',
  pending_final: 'Validation définitive demandée',
  final_validated: 'Validé définitivement',
  refused: 'Correction demandée',
}

export const TRAVAIL_VALIDATION_STYLES = {
  pending_initial: { bg: '#fef9c3', color: '#854d0e' },
  initial_validated: { bg: '#dbeafe', color: '#1e40af' },
  pending_final: { bg: '#ffedd5', color: '#9a3412' },
  final_validated: { bg: '#dcfce7', color: '#166534' },
  refused: { bg: '#fee2e2', color: '#991b1b' },
}

export function isFinalWorkStatus(status) {
  return FINAL_WORK_STATUSES.includes(status)
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
