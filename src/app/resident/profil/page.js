import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getInitials, getResidentYear, formatDate } from '@/lib/utils'
import { getResidentProgressRows, indexProgressByProcedure, getCountForRequiredLevel } from '@/lib/logbook'
import PasswordChange from '@/components/profile/PasswordChange'

export default async function ProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: objectives },
    { data: categories },
    { count: travauxCount },
    progressRows,
    totalRes,
    validatedRes,
    pendingRes,
    refusedRes,
    pendingTravaux,
    initialValidatedTravaux,
    finalValidatedTravaux,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, residanat_start_date, promotion').eq('id', user.id).single(),
    supabase.from('procedure_objectives').select('procedure_id, min_count, required_level, procedures(category_id)').eq('is_active', true),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).eq('resident_id', user.id),
    getResidentProgressRows(supabase, user.id),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'validated'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'pending'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'refused'),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).eq('resident_id', user.id).in('validation_status', ['pending_initial', 'pending_final']),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).eq('resident_id', user.id).eq('validation_status', 'initial_validated'),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).eq('resident_id', user.id).eq('validation_status', 'final_validated'),
  ])

  const year = getResidentYear(profile?.residanat_start_date)
  const normalizedObjectives = (objectives ?? []).filter((objective) => objective.required_level > 0)
  const progressIndex = indexProgressByProcedure(progressRows)

  const stats = {
    total: totalRes.count ?? 0,
    validated: validatedRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    refused: refusedRes.count ?? 0,
    travaux: travauxCount ?? 0,
    travauxPending: pendingTravaux.count ?? 0,
    travauxInitial: initialValidatedTravaux.count ?? 0,
    travauxFinal: finalValidatedTravaux.count ?? 0,
  }

  const totalRequired = normalizedObjectives.reduce((sum, objective) => sum + objective.min_count, 0)
  const totalDone = normalizedObjectives.reduce((sum, objective) => {
    const count = getCountForRequiredLevel(progressIndex[objective.procedure_id], objective.required_level)
    return sum + Math.min(count, objective.min_count)
  }, 0)
  const progressPct = totalRequired ? Math.min(100, Math.round((totalDone / totalRequired) * 100)) : 0

  const catProgress = (categories ?? [])
    .map((category) => {
      const catObjectives = normalizedObjectives.filter((objective) => objective.procedures?.category_id === category.id)
      const required = catObjectives.reduce((sum, objective) => sum + objective.min_count, 0)
      const done = catObjectives.reduce((sum, objective) => {
        const count = getCountForRequiredLevel(progressIndex[objective.procedure_id], objective.required_level)
        return sum + Math.min(count, objective.min_count)
      }, 0)
      return { ...category, required, done, pct: required ? Math.min(100, Math.round((done / required) * 100)) : 0 }
    })
    .filter((category) => category.required > 0)

  return (
    <div className="max-w-2xl space-y-4 p-5 md:p-8">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold" style={{ backgroundColor: '#E8F4FC', color: '#0D2B4E' }}>
            {getInitials(profile?.full_name)}
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#0D2B4E' }}>{profile?.full_name}</h1>
            <p className="text-sm text-slate-500">Resident · Année {year}</p>
            <p className="mt-0.5 text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-center">
          {[
            { label: 'Promotion', value: profile?.promotion ?? '-' },
            { label: 'Debut residanat', value: profile?.residanat_start_date ? formatDate(profile.residanat_start_date) : '-' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-slate-50 p-3">
              <p className="mb-0.5 text-xs text-slate-400">{item.label}</p>
              <p className="text-sm font-semibold" style={{ color: '#0D2B4E' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold" style={{ color: '#0D2B4E' }}>Statistiques</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Validés', value: stats.validated, bg: '#dcfce7', color: '#166534' },
            { label: 'En attente', value: stats.pending, bg: '#fef9c3', color: '#854d0e' },
            { label: 'Refusés', value: stats.refused, bg: '#fee2e2', color: '#991b1b' },
            { label: 'Travaux', value: stats.travaux, bg: '#f3e8ff', color: '#6b21a8' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: stat.bg }}>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="mt-0.5 text-xs" style={{ color: `${stat.color}cc` }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold" style={{ color: '#0D2B4E' }}>Validation des travaux scientifiques</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'À valider', value: stats.travauxPending, bg: '#fef9c3', color: '#854d0e' },
            { label: 'Initiale faite', value: stats.travauxInitial, bg: '#dbeafe', color: '#1e40af' },
            { label: 'Finale faite', value: stats.travauxFinal, bg: '#dcfce7', color: '#166534' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-3" style={{ backgroundColor: stat.bg }}>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="mt-0.5 text-xs" style={{ color: `${stat.color}cc` }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: '#0D2B4E' }}>Progression globale</p>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: progressPct >= 100 ? '#dcfce7' : '#E8F4FC', color: progressPct >= 100 ? '#166534' : '#0D2B4E' }}>
            {progressPct}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: progressPct >= 100 ? '#16a34a' : '#0D2B4E' }} />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">{totalDone} / {totalRequired} objectifs atteints au niveau requis</p>
      </div>

      {catProgress.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold" style={{ color: '#0D2B4E' }}>Par specialite</p>
          <div className="space-y-4">
            {catProgress.map((category) => (
              <div key={category.id}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color_hex }} />
                    <span className="text-xs font-medium text-slate-700">{category.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {category.done}/{category.required}
                    {category.pct >= 100 && <span className="ml-1 text-green-600">OK</span>}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${category.pct}%`, backgroundColor: category.color_hex }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PasswordChange />
    </div>
  )
}
