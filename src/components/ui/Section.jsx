export default function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      {title && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      )}
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}
