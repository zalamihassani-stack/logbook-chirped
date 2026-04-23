import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  getInitials,
  getResidentYear,
  formatDate,
  normalizeObjectives,
  countValidatedAtOrAboveByProcedure,
} from '@/lib/utils'
import PasswordChange from './PasswordChange'

function getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts) {
  const counts = objective.required_level >= 4 ? autonomyCounts : supervisionCounts
  return counts[objective.procedure_id] ?? 0
}

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: reals }, { data: objectives }, { data: categories }, { count: travauxCount }] = await Promise.all([
    supabase.from('profiles').select('full_name, residanat_start_date, promotion').eq('id', user.id).single(),
    supabase
      .from('realisations')
      .select('status, procedure_id, participation_level, procedures(category_id)')
      .eq('resident_id', user.id),
    supabase.from('procedure_objectives').select('procedure_id, min_count, required_level, procedures(category_id)'),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).eq('resident_id', user.id),
  ])

  const year = getResidentYear(profile?.residanat_start_date)
  const allReals = reals ?? []
  const validated = allReals.filter((realisation) => realisation.status === 'validated')
  const normalizedObjectives = normalizeObjectives(objectives).filter((objective) => objective.required_level > 0)
  const supervisionCounts = countValidatedAtOrAboveByProcedure(allReals, 3)
  const autonomyCounts = countValidatedAtOrAboveByProcedure(allReals, 4)

  const stats = {
    total: allReals.length,
    validated: validated.length,
    pending: allReals.filter((realisation) => realisation.status === 'pending').length,
    refused: allReals.filter((realisation) => realisation.status === 'refused').length,
    travaux: travauxCount ?? 0,
  }

  const totalRequired = normalizedObjectives.reduce((sum, objective) => sum + objective.min_count, 0)
  const totalDone = normalizedObjectives.reduce((sum, objective) => {
    const done = getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts)
    return sum + Math.min(done, objective.min_count)
  }, 0)
  const progressPct = totalRequired ? Math.min(100, Math.round((totalDone / totalRequired) * 100)) : 0

  const catProgress = (categories ?? [])
    .map((category) => {
      const catObjectives = normalizedObjectives.filter((objective) => objective.procedures?.category_id === category.id)
      const required = catObjectives.reduce((sum, objective) => sum + objective.min_count, 0)
      const done = catObjectives.reduce((sum, objective) => {
        const count = getValidatedCountForObjective(objective, supervisionCounts, autonomyCounts)
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
            <p className="text-sm text-slate-500">Resident · Annee {year}</p>
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
            { label: 'Valides', value: stats.validated, bg: '#dcfce7', color: '#166534' },
            { label: 'En attente', value: stats.pending, bg: '#fef9c3', color: '#854d0e' },
            { label: 'Refuses', value: stats.refused, bg: '#fee2e2', color: '#991b1b' },
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
