'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ChevronRight } from 'lucide-react'
import { getInitials, getResidentYear } from '@/lib/utils'

export default function ProgressionTab({ residents }) {
  const [data, setData] = useState({}) // { residentId: { done, total, pending, travaux } }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (residents.length === 0) { setLoading(false); return }
    fetchStats()
  }, [])

  async function fetchStats() {
    const supabase = createClient()
    const ids = residents.map(r => r.id)

    // Objectifs supervision (3) + autonome (4) par année, min 1 par geste
    const [realsRes, travauxRes, objectivesRes] = await Promise.all([
      supabase.from('realisations').select('resident_id, status, procedure_id').in('resident_id', ids),
      supabase.from('travaux_scientifiques').select('resident_id').in('resident_id', ids),
      supabase.from('procedure_objectives')
        .select('procedure_id, year, required_level')
        .in('required_level', [3, 4]),
    ])

    const reals = realsRes.data ?? []
    const objectives = objectivesRes.data ?? []

    // Grouper objectifs par année : { year -> Set(procedure_id) }
    const objByYear = {}
    for (const o of objectives) {
      if (!objByYear[o.year]) objByYear[o.year] = new Set()
      objByYear[o.year].add(o.procedure_id)
    }

    // Grouper realisations validées par résident
    const validatedByResident = {}
    const pendingByResident = {}
    for (const r of reals) {
      if (r.status === 'validated') {
        if (!validatedByResident[r.resident_id]) validatedByResident[r.resident_id] = new Set()
        validatedByResident[r.resident_id].add(r.procedure_id)
      }
      if (r.status === 'pending') {
        pendingByResident[r.resident_id] = (pendingByResident[r.resident_id] ?? 0) + 1
      }
    }

    // Grouper travaux
    const travauxMap = {}
    for (const t of (travauxRes.data ?? [])) {
      travauxMap[t.resident_id] = (travauxMap[t.resident_id] ?? 0) + 1
    }

    // Calculer pour chaque résident
    const result = {}
    for (const r of residents) {
      const year = getResidentYear(r.residanat_start_date)
      const yearProcedures = objByYear[year] ?? new Set()
      const validatedProcs = validatedByResident[r.id] ?? new Set()
      const done = [...yearProcedures].filter(pid => validatedProcs.has(pid)).length
      result[r.id] = {
        done,
        total: yearProcedures.size,
        pending: pendingByResident[r.id] ?? 0,
        travaux: travauxMap[r.id] ?? 0,
      }
    }

    setData(result)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    )
  }

  // Trier : actes en attente d'abord, puis progression desc
  const sorted = [...residents].sort((a, b) => {
    const pa = data[a.id]?.pending ?? 0
    const pb = data[b.id]?.pending ?? 0
    if (pb !== pa) return pb - pa
    const pctA = data[a.id]?.total ? data[a.id].done / data[a.id].total : 0
    const pctB = data[b.id]?.total ? data[b.id].done / data[b.id].total : 0
    return pctB - pctA
  })

  return (
    <div>
      <p className="text-xs text-slate-500 mb-4">
        {residents.length} résident(s) actif(s) · progression sur objectifs supervision + autonome (min. 1 par geste)
      </p>

      <div className="space-y-2">
        {sorted.map(r => {
          const s = data[r.id] ?? { done: 0, total: 0, pending: 0, travaux: 0 }
          const year = getResidentYear(r.residanat_start_date)
          const pct = s.total > 0 ? Math.min(100, Math.round((s.done / s.total) * 100)) : 0
          const color = pct >= 80 ? '#166534' : pct >= 50 ? '#0D2B4E' : '#854d0e'

          return (
            <Link key={r.id} href={`/enseignant/residents/${r.id}`}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: '#E8F4FC', color: '#0D2B4E' }}>
                {getInitials(r.full_name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold text-slate-800">{r.full_name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: '#E8F4FC', color: '#0D2B4E' }}>
                    Année {year}
                  </span>
                  {s.pending > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
                      {s.pending} en attente
                    </span>
                  )}
                </div>

                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-1">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>

                <p className="text-xs text-slate-500">
                  {s.done}/{s.total} objectifs atteints · {s.travaux} travaux
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            </Link>
          )
        })}
        {residents.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">Aucun résident actif</p>
        )}
      </div>
    </div>
  )
}
