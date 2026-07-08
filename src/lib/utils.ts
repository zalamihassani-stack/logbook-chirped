type ResidentYear = 1 | 2 | 3 | 4 | 5

export function getResidentYear(residanat_start_date: string | null | undefined): ResidentYear {
  if (!residanat_start_date) return 1
  const start = new Date(residanat_start_date)
  const now = new Date()
  const years = Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return Math.min(5, Math.max(1, years + 1)) as ResidentYear
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

export function getInitials(fullName: string | null | undefined): string {
  if (!fullName) return '?'
  return fullName
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function maskPatientIdentifier(value: string | number | null | undefined): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (raw.length <= 4) return '••••'
  return `${raw.slice(0, 2)}•••${raw.slice(-2)}`
}

export { ACTIVITY_TYPE_LABELS, OBJECTIF_LEVEL_LABELS } from '@/lib/logbook'

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  enseignant: 'Enseignant',
  resident: 'Résident',
}
