export default function EmptyCard({ message = 'Aucun résultat' }) {
  return (
    <p className="rounded-2xl border border-slate-100 bg-white py-8 text-center text-sm text-slate-400 shadow-sm">
      {message}
    </p>
  )
}
