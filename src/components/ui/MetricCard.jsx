export default function MetricCard({ label, value, icon: Icon, iconBg, iconColor, loading, compact = false }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${compact ? 'p-3' : 'p-4'}`}>
      <div className={compact ? 'flex items-center gap-3' : ''}>
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl ${compact ? 'h-9 w-9' : 'mb-3 h-10 w-10'}`}
          style={{ backgroundColor: iconBg ?? 'var(--color-ice)' }}
        >
          {Icon && <Icon size={compact ? 18 : 20} strokeWidth={1.75} style={{ color: iconColor ?? 'var(--color-navy)' }} />}
        </div>
        <div className="min-w-0">
          <p className={`${compact ? 'text-xl leading-none' : 'text-2xl'} font-bold`} style={{ color: 'var(--color-navy)' }}>
            {loading ? (
              <span className="inline-block h-6 w-10 animate-pulse rounded-md bg-slate-200" />
            ) : (value ?? '-')}
          </p>
          <p className={`${compact ? 'mt-1' : 'mt-0.5'} text-xs leading-tight text-slate-500`}>{label}</p>
        </div>
      </div>
    </div>
  )
}
