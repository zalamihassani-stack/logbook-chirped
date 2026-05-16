import AppModal from './AppModal'

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'danger',
  loading = false,
  onCancel,
  onConfirm,
}) {
  const confirmClass = tone === 'danger'
    ? 'bg-red-600 text-white'
    : 'text-white'

  return (
    <AppModal title={title} subtitle={description} onClose={onCancel} maxWidth="max-w-sm">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 rounded-xl py-2 text-sm font-medium disabled:opacity-60 ${confirmClass}`}
          style={tone === 'primary' ? { backgroundColor: 'var(--color-navy)' } : undefined}
        >
          {loading ? '...' : confirmLabel}
        </button>
      </div>
    </AppModal>
  )
}
