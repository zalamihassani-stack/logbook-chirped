const STYLES = {
  pending: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', label: 'En attente' },
  validated: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: 'Validé' },
  refused: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', label: 'Refusé' },
  ecriture: { bg: 'var(--color-ice)', color: 'var(--color-navy)', label: "En cours d'écriture" },
  en_cours: { bg: 'var(--color-ice)', color: 'var(--color-navy)', label: 'En cours' },
  soumis: { bg: 'var(--color-info-light)', color: 'var(--color-info)', label: 'Soumis' },
  accepte: { bg: '#ccfbf1', color: '#065f46', label: 'Accepté' },
  publie: { bg: '#ede9fe', color: '#5b21b6', label: 'Publié' },
  presente: { bg: '#f3e8ff', color: '#6b21a8', label: 'Présenté' },
  admin: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', label: 'Admin' },
  enseignant: { bg: 'var(--color-info-light)', color: 'var(--color-info)', label: 'Enseignant' },
  resident: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: 'Résident' },
}

export default function Badge({ status, className = '' }) {
  const s = STYLES[status] ?? { bg: '#f1f5f9', color: '#475569', label: status }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}
