'use client'
import { useRouter } from 'next/navigation'

export default function ObjectifsFilters({ year, filterCat, filterLevel, categories }) {
  const router = useRouter()

  function navigate(overrides) {
    const p = new URLSearchParams({
      year,
      ...(filterCat   && { cat:   filterCat }),
      ...(filterLevel && { level: filterLevel }),
      ...overrides,
    })
    ;['cat', 'level'].forEach(k => { if (p.get(k) === '') p.delete(k) })
    router.push(`/enseignant/objectifs?${p}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <select
        value={year}
        onChange={e => navigate({ year: e.target.value })}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
      >
        {[1, 2, 3, 4, 5].map(y => (
          <option key={y} value={y}>Année {y}</option>
        ))}
      </select>
      <select
        value={filterLevel}
        onChange={e => navigate({ level: e.target.value })}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
      >
        <option value="">Tous les niveaux</option>
        <option value="4">Autonome</option>
        <option value="3">Sous supervision</option>
        <option value="2">Aide opératoire</option>
        <option value="1">Observation</option>
      </select>
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
    </div>
  )
}
