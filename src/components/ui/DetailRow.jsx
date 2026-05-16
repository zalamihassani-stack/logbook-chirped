export default function DetailRow({ label, value, children }) {
  const content = children ?? value
  if (content == null || content === '') return null
  return (
    <div className="flex gap-3">
      <span className="w-44 flex-shrink-0 pt-0.5 text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-800">{content}</span>
    </div>
  )
}
