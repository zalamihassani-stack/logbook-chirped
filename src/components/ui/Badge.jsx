const STYLES = {
  pending: { bg: '#fef9c3', color: '#854d0e', label: 'En attente' },
  validated: { bg: '#dcfce7', color: '#166534', label: 'Validé' },
  refused: { bg: '#fee2e2', color: '#991b1b', label: 'Refusé' },
  soumis: { bg: '#dbeafe', color: '#1e40af', label: 'Soumis' },
  accepte: { bg: '#ccfbf1', color: '#065f46', label: 'Accepté' },
  publie: { bg: '#ede9fe', color: '#5b21b6', label: 'Publié' },
  admin: { bg: '#fee2e2', color: '#991b1b', label: 'Admin' },
  enseignant: { bg: '#dbeafe', color: '#1e40af', label: 'Enseignant' },
  resident: { bg: '#dcfce7', color: '#166534', label: 'Résident' },
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
