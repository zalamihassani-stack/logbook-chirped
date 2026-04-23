import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import ExportFicheButton from './ExportFicheButton'
import {
  formatDate,
  getInitials,
  getResidentYear,
  PARTICIPATION_LEVELS,
  normalizeObjectives,
  countValidatedAtOrAboveByProcedure,
} from '@/lib/utils'

const TRAVAIL_STATUS = { submitted: 'Soumis', accepted: 'Accepte', published: 'Publie', presented: 'Presente' }
const TRAVAIL_STATUS_STYLE = {
  submitted: { bg: '#fef9c3', color: '#854d0e' },
  accepted: { bg: '#dbeafe', color: '#1e40af' },
  published: { bg: '#dcfce7', color: '#166534' },
  presented: { bg: '#f3e8ff', color: '#6b21a8' },
}

function getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts) {
  const counts = objective.required_level >= 4 ? autonomyCounts : supervisionCounts
  return counts[objective.procedure_id] ?? 0
}

export default async function ResidentFichePage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: resident }, { data: realisations }, { data: objectives }, { data: travaux }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).single(),
    admin
      .from('realisations')
      .select('id, performed_at, participation_level, status, procedure_id, procedures(name, id), profiles!enseignant_id(full_name)')
      .eq('resident_id', id)
      .order('performed_at', { ascending: false }),
    supabase.from('procedure_objectives').select('procedure_id, year, required_level, min_count'),
    admin
      .from('travaux_scientifiques')
      .select('id, title, journal_or_event, year, status, type_id, travail_types(name, color_hex)')
      .eq('resident_id', id)
      .order('year', { ascending: false }),
  ])

  if (!resident) notFound()

  const year = getResidentYear(resident.residanat_start_date)
  const yearObjectives = normalizeObjectives(objectives).filter((objective) => objective.year === year && objective.required_level > 0)
  const validated = (realisations ?? []).filter((realisation) => realisation.status === 'validated')
  const supervisionCounts = countValidatedAtOrAboveByProcedure(realisations, 3)
  const autonomyCounts = countValidatedAtOrAboveByProcedure(realisations, 4)

  const stats = {
    total: realisations?.length ?? 0,
    validated: validated.length,
    pending: (realisations ?? []).filter((realisation) => realisation.status === 'pending').length,
    refused: (realisations ?? []).filter((realisation) => realisation.status === 'refused').length,
  }

  const insufficient = yearObjectives.filter((objective) => {
    const done = getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts)
    return done < objective.min_count
  })

  const doneCount = yearObjectives.filter((objective) => {
    const done = getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts)
    return done >= objective.min_count
  }).length
  const pct = yearObjectives.length ? Math.min(100, Math.round((doneCount / yearObjectives.length) * 100)) : 0

  return (
    <div className="max-w-3xl p-5 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-bold" style={{ backgroundColor: '#E8F4FC', color: '#0D2B4E' }}>
          {getInitials(resident.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold" style={{ color: '#0D2B4E' }}>{resident.full_name}</h1>
          <p className="text-sm text-slate-500">Annee {year} · Promo {resident.promotion ?? '-'}</p>
        </div>
        <ExportFicheButton resident={resident} realisations={realisations ?? []} travaux={travaux ?? []} stats={stats} year={year} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, bg: '#E8F4FC', color: '#0D2B4E' },
          { label: 'Valides', value: stats.validated, bg: '#dcfce7', color: '#166534' },
          { label: 'En attente', value: stats.pending, bg: '#fef9c3', color: '#854d0e' },
          { label: 'Refuses', value: stats.refused, bg: '#fee2e2', color: '#991b1b' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-1.5 flex justify-between text-xs text-slate-500">
          <span>Progression annuelle (niveau requis atteint)</span>
          <span>{doneCount} / {yearObjectives.length} objectifs</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? '#166534' : pct >= 50 ? '#0D2B4E' : '#854d0e' }} />
        </div>
        <p className="mt-1 text-right text-xs text-slate-400">{pct}%</p>
      </div>

      {insufficient.length > 0 && (
        <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="mb-2 text-sm font-semibold text-orange-700">Objectifs non atteints ({insufficient.length})</p>
          <div className="space-y-1">
            {insufficient.map((objective) => (
              <p key={objective.procedure_id} className="text-xs text-orange-600">
                · {objective.procedure_id} - min. 1 {objective.required_level >= 4 ? 'autonome' : 'sous supervision'} requis
              </p>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 text-base font-semibold" style={{ color: '#0D2B4E' }}>Historique des gestes</h2>
      <div className="mb-8 space-y-2">
        {(realisations ?? []).map((realisation) => (
          <div key={realisation.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{realisation.procedures?.name ?? '-'}</p>
              <p className="mt-0.5 text-xs text-slate-500">{formatDate(realisation.performed_at)} · {PARTICIPATION_LEVELS[realisation.participation_level]}</p>
            </div>
            <Badge status={realisation.status} />
          </div>
        ))}
        {(realisations ?? []).length === 0 && <p className="py-6 text-center text-sm text-slate-400">Aucun acte enregistre</p>}
      </div>

      <h2 className="mb-3 text-base font-semibold" style={{ color: '#0D2B4E' }}>
        Travaux scientifiques
        <span className="ml-2 text-xs font-normal text-slate-400">({(travaux ?? []).length})</span>
      </h2>
      <div className="space-y-2">
        {(travaux ?? []).map((travail) => {
          const statusStyle = TRAVAIL_STATUS_STYLE[travail.status] ?? { bg: '#f1f5f9', color: '#64748b' }
          return (
            <div key={travail.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{travail.title}</p>
                  {travail.journal_or_event && <p className="mt-0.5 text-xs text-slate-500">{travail.journal_or_event} · {travail.year}</p>}
                  {travail.travail_types && (
                    <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${travail.travail_types.color_hex}25`, color: travail.travail_types.color_hex }}>
                      {travail.travail_types.name}
                    </span>
                  )}
                </div>
                <span className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                  {TRAVAIL_STATUS[travail.status] ?? travail.status}
                </span>
              </div>
            </div>
          )
        })}
        {(travaux ?? []).length === 0 && <p className="py-6 text-center text-sm text-slate-400">Aucun travail scientifique enregistre</p>}
      </div>
    </div>
  )
}
