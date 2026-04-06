'use client'
import { useRouter } from 'next/navigation'

export default function RefYearFilter({ refYear, refLevel }) {
  const router = useRouter()

  function navigate(overrides) {
    const p = new URLSearchParams({
      tab: 'referentiel',
      year: refYear,
      ...(refLevel && { level: refLevel }),
      ...overrides,
    })
    if (p.get('level') === '') p.delete('level')
    router.push(`/resident/referentiel?${p}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <select
        value={refYear}
        onChange={e => navigate({ year: e.target.value })}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
      >
        {[1, 2, 3, 4, 5].map(y => (
          <option key={y} value={y}>Année {y}</option>
        ))}
      </select>
      <select
        value={refLevel}
        onChange={e => navigate({ level: e.target.value })}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
      >
        <option value="">Tous les niveaux</option>
        <option value="4">Autonome</option>
        <option value="3">Sous supervision</option>
        <option value="2">Aide opératoire</option>
        <option value="1">Observation</option>
      </select>
    </div>
  )
}
