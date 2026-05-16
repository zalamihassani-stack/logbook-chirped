'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SlidersHorizontal, Search } from 'lucide-react'

export default function HistoriqueFilters({ filterStatus, filterActivity, filterEnseignant, dateFrom, dateTo, query, enseignants, hasFilters }) {
  const router = useRouter()

  function navigate(overrides) {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    const next = { activity: filterActivity, enseignant: filterEnseignant, from: dateFrom, to: dateTo, q: query, ...overrides }
    if (next.activity) params.set('activity', next.activity)
    if (next.enseignant) params.set('enseignant', next.enseignant)
    if (next.from) params.set('from', next.from)
    if (next.to) params.set('to', next.to)
    if (next.q) params.set('q', next.q)
    const qs = params.toString()
    router.push(`/resident/historique${qs ? `?${qs}` : ''}`)
  }

  return (
    <>
      <form
        className="mb-3"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          navigate({ q: (fd.get('q') ?? '').trim() })
        }}
      >
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Rechercher un geste..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-400"
          />
        </div>
      </form>

      <details className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm" open={hasFilters}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={16} strokeWidth={1.8} />
            Filtres
          </span>
          {hasFilters && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">actifs</span>}
        </summary>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select
          value={filterActivity}
          onChange={(e) => navigate({ activity: e.target.value })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">Tous les niveaux</option>
          <option value="expose">Exposé</option>
          <option value="supervise">Supervisé</option>
          <option value="autonome">Autonome</option>
        </select>

        <select
          value={filterEnseignant}
          onChange={(e) => navigate({ enseignant: e.target.value })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">Tous les encadrants</option>
          {enseignants?.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>

        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            navigate({ from: fd.get('from') ?? '', to: fd.get('to') ?? '' })
          }}
        >
          <input
            type="date"
            name="from"
            defaultValue={dateFrom}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          />
          <input
            type="date"
            name="to"
            defaultValue={dateTo}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white sm:col-span-2"
            style={{ backgroundColor: 'var(--color-navy)' }}
          >
            Appliquer les dates
          </button>
        </form>

          {hasFilters && (
            <Link
              href={filterStatus ? `/resident/historique?status=${filterStatus}` : '/resident/historique'}
              className="rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-500 hover:text-slate-700 sm:col-span-2"
            >
              Réinitialiser les filtres
            </Link>
          )}
        </div>
      </details>
    </>
  )
}
