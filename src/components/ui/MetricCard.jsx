export default function MetricCard({ label, value, icon: Icon, iconBg, iconColor, loading }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: iconBg ?? 'var(--color-ice)' }}
      >
        {Icon && <Icon size={20} strokeWidth={1.75} style={{ color: iconColor ?? 'var(--color-navy)' }} />}
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--color-navy)' }}>
        {loading ? (
          <span className="inline-block w-10 h-6 rounded-md bg-slate-200 animate-pulse" />
        ) : (value ?? '—')}
      </p>
      <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}
