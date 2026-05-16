export default function InfoRow({ label, value, children, className = '' }) {
  const content = children ?? value
  return (
    <div className={`rounded-xl bg-slate-50 px-4 py-3 ${className}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
        {content ?? '-'}
      </p>
    </div>
  )
}

