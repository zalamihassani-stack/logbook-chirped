import { SlidersHorizontal } from 'lucide-react'

export default function FilterPanel({ active = false, title = 'Filtres', children, className = '' }) {
  return (
    <details className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ${className}`} open={active}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal size={16} strokeWidth={1.8} />
          {title}
        </span>
        {active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">actifs</span>}
      </summary>
      <div className="mt-4">
        {children}
      </div>
    </details>
  )
}

