'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ChevronRight } from 'lucide-react'
import { getInitials, getResidentYear, normalizeObjectives, countValidatedAtOrAboveByProcedure } from '@/lib/utils'

function getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts) {
  const counts = objective.required_level >= 4 ? autonomyCounts : supervisionCounts
  return counts[objective.procedure_id] ?? 0
}

export default function ProgressionTab({ residents }) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadStats() {
      if (residents.length === 0) {
        if (active) {
          setData({})
          setLoading(false)
        }
        return
      }

      setLoading(true)

      const supabase = createClient()
      const ids = residents.map((resident) => resident.id)

      const [realsRes, travauxRes, objectivesRes] = await Promise.all([
        supabase
          .from('realisations')
          .select('resident_id, status, procedure_id, participation_level')
          .in('resident_id', ids),
        supabase.from('travaux_scientifiques').select('resident_id').in('resident_id', ids),
        supabase.from('procedure_objectives').select('procedure_id, year, required_level, min_count'),
      ])

      const reals = realsRes.data ?? []
      const objectives = normalizeObjectives(objectivesRes.data).filter((objective) => objective.required_level > 0)

      const objByYear = {}
      for (const objective of objectives) {
        if (!objByYear[objective.year]) objByYear[objective.year] = []
        objByYear[objective.year].push(objective)
      }

      const realsByResident = {}
      const pendingByResident = {}
      for (const realisation of reals) {
        if (!realsByResident[realisation.resident_id]) {
          realsByResident[realisation.resident_id] = []
        }
        realsByResident[realisation.resident_id].push(realisation)
        if (realisation.status === 'pending') {
          pendingByResident[realisation.resident_id] = (pendingByResident[realisation.resident_id] ?? 0) + 1
        }
      }

      const travauxMap = {}
      for (const travail of travauxRes.data ?? []) {
        travauxMap[travail.resident_id] = (travauxMap[travail.resident_id] ?? 0) + 1
      }

      const result = {}
      for (const resident of residents) {
        const year = getResidentYear(resident.residanat_start_date)
        const yearObjectives = objByYear[year] ?? []
        const residentReals = realsByResident[resident.id] ?? []
        const supervisionCounts = countValidatedAtOrAboveByProcedure(residentReals, 3)
        const autonomyCounts = countValidatedAtOrAboveByProcedure(residentReals, 4)

        const done = yearObjectives.filter((objective) => {
          const count = getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts)
          return count >= objective.min_count
        }).length

        result[resident.id] = {
          done,
          total: yearObjectives.length,
          pending: pendingByResident[resident.id] ?? 0,
          travaux: travauxMap[resident.id] ?? 0,
        }
      }

      if (active) {
        setData(result)
        setLoading(false)
      }
    }

    loadStats()

    return () => {
      active = false
    }
  }, [residents])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    )
  }

  const sorted = [...residents].sort((a, b) => {
    const pendingA = data[a.id]?.pending ?? 0
    const pendingB = data[b.id]?.pending ?? 0
    if (pendingB !== pendingA) return pendingB - pendingA

    const progressA = data[a.id]?.total ? data[a.id].done / data[a.id].total : 0
    const progressB = data[b.id]?.total ? data[b.id].done / data[b.id].total : 0
    return progressB - progressA
  })

  return (
    <div>
      <p className="mb-4 text-xs text-slate-500">
        {residents.length} resident(s) actif(s) · progression sur gestes valides au niveau requis (min. 1 par geste)
      </p>

      <div className="space-y-2">
        {sorted.map((resident) => {
          const stats = data[resident.id] ?? { done: 0, total: 0, pending: 0, travaux: 0 }
          const year = getResidentYear(resident.residanat_start_date)
          const pct = stats.total > 0 ? Math.min(100, Math.round((stats.done / stats.total) * 100)) : 0
          const color = pct >= 80 ? '#166534' : pct >= 50 ? '#0D2B4E' : '#854d0e'

          return (
            <Link
              key={resident.id}
              href={`/enseignant/residents/${resident.id}`}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: '#E8F4FC', color: '#0D2B4E' }}>
                {getInitials(resident.full_name)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{resident.full_name}</p>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: '#E8F4FC', color: '#0D2B4E' }}>
                    Annee {year}
                  </span>
                  {stats.pending > 0 && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
                      {stats.pending} en attente
                    </span>
                  )}
                </div>

                <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>

                <p className="text-xs text-slate-500">
                  {stats.done}/{stats.total} objectifs atteints · {stats.travaux} travaux
                </p>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            </Link>
          )
        })}

        {residents.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Aucun resident actif</p>}
      </div>
    </div>
  )
}
