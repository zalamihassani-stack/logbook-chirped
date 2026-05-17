import { X } from 'lucide-react'

export default function AppModal({ title, subtitle, children, footer, onClose, maxWidth = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white p-6 shadow-xl ${maxWidth}`}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-bold" style={{ color: 'var(--color-navy)' }}>{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-50">
              <X size={20} />
            </button>
          )}
        </div>
        {children}
        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  )
}
