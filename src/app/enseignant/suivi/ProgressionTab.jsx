'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ChevronRight } from 'lucide-react'
import { getInitials, getResidentYear } from '@/lib/utils'

export default function ProgressionTab({ residents }) {
  const [stats, setStats] = useState({})
  const [travaux, setTravaux] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (residents.length === 0) { setLoading(false); return }
    fetchStats()
  }, [])

  async function fetchStats() {
    const supabase = createClient()
    const ids = residents.map(r => r.id)

    const [realsRes, travauxRes] = await Promise.all([
      supabase.from('realisations').select('resident_id, status').in('resident_id', ids),
      supabase.from('travaux_scientifiques').select('resident_id').in('resident_id', ids),
    ])

    // Grouper par résident
    const statsMap = {}
    for (const r of (realsRes.data ?? [])) {
      if (!statsMap[r.resident_id]) statsMap[r.resident_id] = { total: 0, validated: 0, pending: 0 }
      statsMap[r.resident_id].total++
      if (r.status === 'validated') statsMap[r.resident_id].validated++
      if (r.status === 'pending')   statsMap[r.resident_id].pending++
    }

    const travauxMap = {}
    for (const t of (travauxRes.data ?? [])) {
      travauxMap[t.resident_id] = (travauxMap[t.resident_id] ?? 0) + 1
    }

    setStats(statsMap)
    setTravaux(travauxMap)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    )
  }

  // Trier : résidents avec actes en attente d'abord, puis par nombre de validés desc
  const sorted = [...residents].sort((a, b) => {
    const pa = stats[a.id]?.pending ?? 0
    const pb = stats[b.id]?.pending ?? 0
    if (pb !== pa) return pb - pa
    return (stats[b.id]?.validated ?? 0) - (stats[a.id]?.validated ?? 0)
  })

  return (
    <div>
      <p className="text-xs text-slate-500 mb-4">
        {residents.length} résident(s) actif(s) · trié par actes en attente puis validés
      </p>

      {/* Grille desktop / liste mobile */}
      <div className="space-y-2">
        {sorted.map(r => {
          const s = stats[r.id] ?? { total: 0, validated: 0, pending: 0 }
          const travailCount = travaux[r.id] ?? 0
          const year = getResidentYear(r.residanat_start_date)
          const pct = s.total > 0 ? Math.min(100, (s.validated / s.total) * 100) : 0

          return (
            <Link key={r.id} href={`/enseignant/residents/${r.id}`}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex items-center gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: '#E8F4FC', color: '#0D2B4E' }}>
                {getInitials(r.full_name)}
              </div>

              {/* Infos principales */}
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

                {/* Barre de progression */}
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-1">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? '#166534' : pct >= 50 ? '#0D2B4E' : '#854d0e' }} />
                </div>

                {/* Stats inline */}
                <p className="text-xs text-slate-500">
                  {s.validated} validés · {s.total} total · {travailCount} travaux
                </p>
              </div>

              {/* % et chevron */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold" style={{ color: pct >= 80 ? '#166534' : pct >= 50 ? '#0D2B4E' : '#854d0e' }}>
                  {Math.round(pct)}%
                </span>
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
