'use client'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'

export default function ReferentielFilters({
  query,
  filterCat,
  filterLevel,
  filterYear,
  categories,
  basePath = '/resident/referentiel',
}) {
  const router = useRouter()
  const hasFilters = Boolean(filterCat || filterLevel || filterYear)

  function navigate(overrides) {
    const params = new URLSearchParams({
      ...(query && { q: query }),
      ...(filterCat && { cat: filterCat }),
      ...(filterLevel && { level: filterLevel }),
      ...(filterYear && { year: filterYear }),
      ...overrides,
    })
    ;['q', 'cat', 'level', 'year'].forEach((key) => { if (params.get(key) === '') params.delete(key) })
    const separator = basePath.includes('?') ? '&' : '?'
    router.push(params.size ? `${basePath}${separator}${params}` : basePath)
  }

  function handleSearch(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    navigate({ q: String(formData.get('q') ?? '').trim() })
  }

  return (
    <div className="mb-5 space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative min-w-0 flex-1">
        <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
        <input
          name="q"
          defaultValue={query}
          placeholder="Rechercher un geste, une pathologie, une categorie..."
          className="w-full rounded-2xl border border-slate-100 bg-white py-3 pl-10 pr-10 text-sm shadow-sm outline-none transition focus:border-sky-300"
        />
          {query && (
            <button
              type="button"
              onClick={() => navigate({ q: '' })}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={15} strokeWidth={1.8} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: 'var(--color-navy)' }}
        >
          Rechercher
        </button>
      </form>

      <details className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm" open={hasFilters}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={16} strokeWidth={1.8} />
            Filtres
          </span>
          {hasFilters && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">actifs</span>}
        </summary>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <select
            value={filterLevel}
            onChange={(event) => navigate({ level: event.target.value })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="">Tous les objectifs</option>
            <option value="1">Exposition</option>
            <option value="2">Supervision</option>
            <option value="3">Maitrise</option>
          </select>

          <select
            value={filterYear}
            onChange={(event) => navigate({ year: event.target.value })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="">Toutes les annees</option>
            {[1, 2, 3, 4, 5].map((year) => <option key={year} value={year}>A{year}</option>)}
          </select>

          <select
            value={filterCat}
            onChange={(event) => navigate({ cat: event.target.value })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="">Toutes les categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={() => navigate({ cat: '', level: '', year: '' })}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 sm:col-span-3"
            >
              Reinitialiser
            </button>
          )}
        </div>
      </details>
    </div>
  )
}
