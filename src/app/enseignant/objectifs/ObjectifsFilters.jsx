'use client'
import { useRouter } from 'next/navigation'

export default function ObjectifsFilters({ year, filterCat, filterLevel, categories }) {
  const router = useRouter()

  function navigate(overrides) {
    const params = new URLSearchParams({
      year,
      ...(filterCat && { cat: filterCat }),
      ...(filterLevel && { level: filterLevel }),
      ...overrides,
    })
    ;['cat', 'level'].forEach((key) => { if (params.get(key) === '') params.delete(key) })
    router.push(`/enseignant/objectifs?${params}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <select
        value={year}
        onChange={(event) => navigate({ year: event.target.value })}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <option key={value} value={value}>Annee {value}</option>
        ))}
      </select>
      <select
        value={filterLevel}
        onChange={(event) => navigate({ level: event.target.value })}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
      >
        <option value="">Tous les niveaux</option>
        <option value="3">Maitrise</option>
        <option value="2">Competence supervisee</option>
        <option value="1">Exposition</option>
      </select>
      <select
        value={filterCat}
        onChange={(event) => navigate({ cat: event.target.value })}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
      >
        <option value="">Toutes les specialites</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>
    </div>
  )
}
