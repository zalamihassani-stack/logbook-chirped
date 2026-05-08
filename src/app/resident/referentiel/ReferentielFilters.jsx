'use client'
import { useRouter } from 'next/navigation'

export default function ReferentielFilters({
  filterCat,
  filterLevel,
  categories,
  basePath = '/resident/referentiel',
  showAllLevels = false,
}) {
  const router = useRouter()

  function navigate(overrides) {
    const params = new URLSearchParams({
      ...(filterCat && { cat: filterCat }),
      ...(filterLevel && { level: filterLevel }),
      ...overrides,
    })
    ;['cat', 'level'].forEach((key) => { if (params.get(key) === '') params.delete(key) })
    router.push(params.size ? `${basePath}?${params}` : basePath)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-500 mb-1">Type d&apos;objectif</label>
        <select
          value={filterLevel}
          onChange={(event) => navigate({ level: event.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white focus:border-sky-400 transition"
        >
          <option value="">Tous les objectifs</option>
          {showAllLevels && <option value="1">Exposition</option>}
          {showAllLevels && <option value="2">Sous supervision</option>}
          <option value="3">Autonomie</option>
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-500 mb-1">Categorie</label>
        <select
          value={filterCat}
          onChange={(event) => navigate({ cat: event.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white focus:border-sky-400 transition"
        >
          <option value="">Toutes les categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
