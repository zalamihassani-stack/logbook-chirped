import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import ExportFicheButton from './ExportFicheButton'
import { formatDate, getInitials, getResidentYear, PARTICIPATION_LEVELS } from '@/lib/utils'

const TRAVAIL_STATUS = { submitted: 'Soumis', accepted: 'Accepté', published: 'Publié', presented: 'Présenté' }
const TRAVAIL_STATUS_STYLE = {
  submitted:  { bg: '#fef9c3', color: '#854d0e' },
  accepted:   { bg: '#dbeafe', color: '#1e40af' },
  published:  { bg: '#dcfce7', color: '#166534' },
  presented:  { bg: '#f3e8ff', color: '#6b21a8' },
}

export default async function ResidentFichePage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: resident }, { data: realisations }, { data: objectives }, { data: travaux }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).single(),
    admin.from('realisations')
      .select('id, performed_at, participation_level, status, procedures(name, id), profiles!enseignant_id(full_name)')
      .eq('resident_id', id).order('performed_at', { ascending: false }),
    supabase.from('procedure_objectives').select('procedure_id, year, required_level, min_count'),
    admin.from('travaux_scientifiques')
      .select('id, title, journal_or_event, year, status, type_id, travail_types(name, color_hex)')
      .eq('resident_id', id).order('year', { ascending: false }),
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
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold" style={{ color: '#0D2B4E' }}>{resident.full_name}</h1>
          <p className="text-sm text-slate-500">Année {year} · Promo {resident.promotion ?? '—'}</p>
        </div>
        <ExportFicheButton
          resident={resident}
          realisations={realisations ?? []}
          travaux={travaux ?? []}
          stats={stats}
          year={year}
        />
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

      {/* Historique des gestes */}
      <h2 className="text-base font-semibold mb-3" style={{ color: '#0D2B4E' }}>Historique des gestes</h2>
      <div className="space-y-2 mb-8">
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

      {/* Travaux scientifiques */}
      <h2 className="text-base font-semibold mb-3" style={{ color: '#0D2B4E' }}>
        Travaux scientifiques
        <span className="ml-2 text-xs font-normal text-slate-400">({(travaux ?? []).length})</span>
      </h2>
      <div className="space-y-2">
        {(travaux ?? []).map(t => {
          const st = TRAVAIL_STATUS_STYLE[t.status] ?? { bg: '#f1f5f9', color: '#64748b' }
          return (
            <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{t.title}</p>
                  {t.journal_or_event && (
                    <p className="text-xs text-slate-500 mt-0.5">{t.journal_or_event} · {t.year}</p>
                  )}
                  {t.travail_types && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                      style={{ backgroundColor: t.travail_types.color_hex + '25', color: t.travail_types.color_hex }}>
                      {t.travail_types.name}
                    </span>
                  )}
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0"
                  style={{ backgroundColor: st.bg, color: st.color }}>
                  {TRAVAIL_STATUS[t.status] ?? t.status}
                </span>
              </div>
            </div>
          )
        })}
        {(travaux ?? []).length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">Aucun travail scientifique enregistré</p>
        )}
      </div>
    </div>
  )
}
