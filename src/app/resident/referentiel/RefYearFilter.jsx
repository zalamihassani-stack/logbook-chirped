'use client'
import { useRouter } from 'next/navigation'

export default function RefYearFilter({ refYear, refLevel }) {
  const router = useRouter()

  function navigate(overrides) {
    const params = new URLSearchParams({
      tab: 'referentiel',
      year: refYear,
      ...(refLevel && { level: refLevel }),
      ...overrides,
    })
    if (params.get('level') === '') params.delete('level')
    router.push(`/resident/referentiel?${params}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <select
        value={refYear}
        onChange={(event) => navigate({ year: event.target.value })}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
      >
        {[1, 2, 3, 4, 5].map((year) => (
          <option key={year} value={year}>Annee {year}</option>
        ))}
      </select>
      <select
        value={refLevel}
        onChange={(event) => navigate({ level: event.target.value })}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
      >
        <option value="">Tous les objectifs</option>
        <option value="3">Autonomie</option>
      </select>
    </div>
  )
}
