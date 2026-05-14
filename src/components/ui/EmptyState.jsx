import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = 'Aucun résultat', description, className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-2 py-10 text-center ${className}`}>
      <Icon size={32} className="text-slate-300" strokeWidth={1.5} />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {description && <p className="text-xs text-slate-400">{description}</p>}
    </div>
  )
}
