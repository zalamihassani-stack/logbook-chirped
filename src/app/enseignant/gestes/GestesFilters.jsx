'use client'
import { useRouter } from 'next/navigation'

export default function GestesFilters({ filterCat, sortBy, categories }) {
  const router = useRouter()

  function navigate(overrides) {
    const p = new URLSearchParams({
      ...(filterCat && { cat: filterCat }),
      ...(sortBy && { sort: sortBy }),
      ...overrides,
    })
    ;['cat', 'sort'].forEach(k => { if (p.get(k) === '') p.delete(k) })
    router.push(`/enseignant/gestes${p.toString() ? '?' + p.toString() : ''}`)
  }

  return (
    <div className="flex gap-3 mb-5 flex-col sm:flex-row">
      <select
        value={filterCat}
        onChange={e => navigate({ cat: e.target.value })}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
      >
        <option value="">Toutes les spécialités</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select
        value={sortBy}
        onChange={e => navigate({ sort: e.target.value })}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
      >
        <option value="count">Trier par nombre de réalisations</option>
        <option value="alpha">Trier par ordre alphabétique</option>
        <option value="autonome">Trier par réalisation en autonome</option>
      </select>
    </div>
  )
}
