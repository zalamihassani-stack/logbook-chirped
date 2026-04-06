import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getInitials, getResidentYear, formatDate } from '@/lib/utils'
import PasswordChange from './PasswordChange'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: reals },
    { data: objectives },
    { data: categories },
    { data: travaux },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, residanat_start_date, promotion').eq('id', user.id).single(),
    supabase.from('realisations').select('status, procedure_id, procedures(category_id)').eq('resident_id', user.id),
    supabase.from('procedure_objectives').select('procedure_id, min_count, procedures(category_id)'),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).eq('resident_id', user.id),
  ])

  const year = getResidentYear(profile?.residanat_start_date)
  const allReals = reals ?? []
  const validated = allReals.filter(r => r.status === 'validated')
  const yearObjectives = (objectives ?? []).filter(o => {
    // même logique que la page objectifs : première apparition du niveau
    return true // on utilise tous les objectifs de l'année pour la progression
  })
  const yearObjs = (objectives ?? []).filter(() => true) // garder simple

  const stats = {
    total: allReals.length,
    validated: validated.length,
    pending: allReals.filter(r => r.status === 'pending').length,
    refused: allReals.filter(r => r.status === 'refused').length,
    travaux: travaux ?? 0,
  }

  const totalRequired = (objectives ?? []).reduce((s, o) => s + o.min_count, 0)
  const progressPct = totalRequired ? Math.min(100, Math.round((stats.validated / totalRequired) * 100)) : 0

  // Progression par catégorie
  const catProgress = (categories ?? []).map(cat => {
    const catObjs = (objectives ?? []).filter(o => o.procedures?.category_id === cat.id)
    const required = catObjs.reduce((s, o) => s + o.min_count, 0)
    const done = validated.filter(r => r.procedures?.category_id === cat.id).length
    return { ...cat, required, done, pct: required ? Math.min(100, Math.round((done / required) * 100)) : 0 }
  }).filter(c => c.required > 0)

  return (
    <div className="p-5 md:p-8 max-w-2xl space-y-4">

      {/* Carte profil */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: '#E8F4FC', color: '#0D2B4E' }}
          >
            {getInitials(profile?.full_name)}
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#0D2B4E' }}>{profile?.full_name}</h1>
            <p className="text-sm text-slate-500">Résident · Année {year}</p>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5 text-center">
          {[
            { label: 'Promotion', value: profile?.promotion ?? '—' },
            { label: 'Début résidanat', value: profile?.residanat_start_date ? formatDate(profile.residanat_start_date) : '—' },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
              <p className="text-sm font-semibold" style={{ color: '#0D2B4E' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <p className="text-sm font-semibold mb-4" style={{ color: '#0D2B4E' }}>Statistiques</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Validés',    value: stats.validated, bg: '#dcfce7', color: '#166534' },
            { label: 'En attente', value: stats.pending,   bg: '#fef9c3', color: '#854d0e' },
            { label: 'Refusés',    value: stats.refused,   bg: '#fee2e2', color: '#991b1b' },
            { label: 'Travaux',    value: stats.travaux,   bg: '#f3e8ff', color: '#6b21a8' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: s.bg }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: s.color + 'cc' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progression annuelle */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold" style={{ color: '#0D2B4E' }}>Progression globale</p>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: progressPct >= 100 ? '#dcfce7' : '#E8F4FC', color: progressPct >= 100 ? '#166534' : '#0D2B4E' }}>
            {progressPct}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${progressPct}%`, backgroundColor: progressPct >= 100 ? '#16a34a' : '#0D2B4E' }} />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">{stats.validated} / {totalRequired} actes requis validés</p>
      </div>

      {/* Progression par spécialité */}
      {catProgress.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm font-semibold mb-4" style={{ color: '#0D2B4E' }}>Par spécialité</p>
          <div className="space-y-4">
            {catProgress.map(c => (
              <div key={c.id}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color_hex }} />
                    <span className="text-xs font-medium text-slate-700">{c.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">{c.done}/{c.required}
                    {c.pct >= 100 && <span className="ml-1 text-green-600">✓</span>}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${c.pct}%`, backgroundColor: c.color_hex }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Changer mot de passe */}
      <PasswordChange />

    </div>
  )
}
