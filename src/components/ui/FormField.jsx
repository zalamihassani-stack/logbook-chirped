export default function FormField({ label, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>{label}</label>}
      {children}
    </div>
  )
}

export function TextInput({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 ${className}`}
      {...props}
    />
  )
}

export function SelectInput({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function TextAreaInput({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 ${className}`}
      {...props}
    />
  )
}

