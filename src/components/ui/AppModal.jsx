import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function AppModal({ title, subtitle, children, footer, onClose, maxWidth = 'max-w-2xl' }) {
  const panelRef = useRef(null)

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!onClose) return
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white p-6 shadow-xl outline-none ${maxWidth}`}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-bold" style={{ color: 'var(--color-navy)' }}>{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-1 text-slate-400 hover:bg-slate-50">
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
