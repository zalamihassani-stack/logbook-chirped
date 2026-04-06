import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDate, getInitials, getResidentYear, PARTICIPATION_LEVELS } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

export default async function ResidentFichePage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: resident }, { data: realisations }, { data: objectives }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('realisations')
      .select('id, performed_at, participation_level, status, procedures(name, id), profiles!enseignant_id(full_name)')
      .eq('resident_id', id).order('performed_at', { ascending: false }),
    supabase.from('procedure_objectives').select('procedure_id, year, required_level, min_count'),
  ])

  if (!resident) notFound()

  const year = getResidentYear(resident.residanat_start_date)
  const yearObjectives = (objectives ?? []).filter(o => o.year === year)
  const validated = (realisations ?? []).filter(r => r.status === 'validated')

  const stats = {
    total: realisations?.length ?? 0,
    validated: validated.length,
    pending: (realisations ?? []).filter(r => r.status === 'pending').length,
    refused: (realisations ?? []).filter(r => r.status === 'refused').length,
  }

  // Gestes insuffisants
  const insufficient = yearObjectives.filter(obj => {
    const count = validated.filter(r => r.procedures?.id === obj.procedure_id).length
    return count < obj.min_count
  })

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
          style={{ backgroundColor: '#E8F4FC', color: '#0D2B4E' }}>
          {getInitials(resident.full_name)}
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0D2B4E' }}>{resident.full_name}</h1>
          <p className="text-sm text-slate-500">Année {year} · Promo {resident.promotion ?? '—'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, bg: '#E8F4FC', color: '#0D2B4E' },
          { label: 'Validés', value: stats.validated, bg: '#dcfce7', color: '#166534' },
          { label: 'En attente', value: stats.pending, bg: '#fef9c3', color: '#854d0e' },
          { label: 'Refusés', value: stats.refused, bg: '#fee2e2', color: '#991b1b' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progression globale */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-5">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Progression annuelle</span>
          <span>{stats.validated} / {yearObjectives.length} objectifs</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full" style={{
            width: yearObjectives.length ? `${Math.min(100, (stats.validated / yearObjectives.length) * 100)}%` : '0%',
            backgroundColor: '#0D2B4E',
          }} />
        </div>
      </div>

      {/* Gestes insuffisants */}
      {insufficient.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-5">
          <p className="text-sm font-semibold text-orange-700 mb-2">Objectifs non atteints ({insufficient.length})</p>
          <div className="space-y-1">
            {insufficient.map(obj => (
              <p key={obj.procedure_id} className="text-xs text-orange-600">
                · {obj.procedure_id} — min. {obj.min_count} requis
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Historique */}
      <h2 className="text-base font-semibold mb-3" style={{ color: '#0D2B4E' }}>Historique</h2>
      <div className="space-y-2">
        {(realisations ?? []).map(r => (
          <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{r.procedures?.name ?? '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatDate(r.performed_at)} · {PARTICIPATION_LEVELS[r.participation_level]}</p>
            </div>
            <Badge status={r.status} />
          </div>
        ))}
        {(realisations ?? []).length === 0 && <p className="text-center text-sm text-slate-400 py-6">Aucun acte enregistré</p>}
      </div>
    </div>
  )
}
