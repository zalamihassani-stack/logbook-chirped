'use client'
import { useRouter } from 'next/navigation'

export default function ReferentielFilters({
  filterCat,
  filterLevel,
  categories,
  basePath = '/resident/referentiel',
}) {
  const router = useRouter()

  function navigate(overrides) {
    const p = new URLSearchParams({
      ...(filterCat && { cat: filterCat }),
      ...(filterLevel && { level: filterLevel }),
      ...overrides,
    })
    ;['cat', 'level'].forEach(k => { if (p.get(k) === '') p.delete(k) })
    router.push(p.size ? `${basePath}?${p}` : basePath)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-500 mb-1">Niveau requis</label>
        <select
          value={filterLevel}
          onChange={e => navigate({ level: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white focus:border-sky-400 transition"
        >
          <option value="">Tous les niveaux</option>
          <option value="1">Observation</option>
          <option value="2">Aide opératoire</option>
          <option value="3">Sous supervision</option>
          <option value="4">Autonome</option>
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-500 mb-1">Catégorie</label>
        <select
          value={filterCat}
          onChange={e => navigate({ cat: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white focus:border-sky-400 transition"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
