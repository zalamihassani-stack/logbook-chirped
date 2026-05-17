import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function ListRowCard({ href, title, subtitle, meta, badge, children, danger = false }) {
  const Component = href ? Link : 'div'
  return (
    <Component
      href={href}
      className={`flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${danger ? 'border border-red-200' : 'border border-slate-100'}`}
    >
      <div className="min-w-0 flex-1">
        {title && <p className="truncate text-sm font-semibold text-slate-800">{title}</p>}
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        {meta && <p className="mt-0.5 text-xs text-slate-400">{meta}</p>}
        {children}
      </div>
      {badge}
      {href && <ChevronRight size={16} className="flex-shrink-0 text-slate-300" />}
    </Component>
  )
}
