import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import ReferentielFilters from './ReferentielFilters'
import RefYearFilter from './RefYearFilter'
import { getResidentYear } from '@/lib/utils'

const LEVELS = { 1: 'Observation', 2: 'Aide opératoire', 3: 'Sous supervision', 4: 'Autonome' }
const LEVEL_STYLE = {
  1: { bg: '#dbeafe', color: '#1e40af' },
  2: { bg: '#fef9c3', color: '#854d0e' },
  3: { bg: '#ffedd5', color: '#9a3412' },
  4: { bg: '#dcfce7', color: '#166534' },
}

function progressBadge(done, required) {
  if (done >= required) return { bg: '#dcfce7', color: '#166534', text: `✓ ${done}/${required}` }
  if (done > 0)         return { bg: '#fef9c3', color: '#854d0e', text: `${done}/${required}` }
  return                       { bg: '#f1f5f9', color: '#64748b', text: `0/${required}` }
}

function GestCard({ o, validatedCounts }) {
  const p = o.procedures
  const cat = p?.categories
  const done = validatedCounts[o.procedure_id] ?? 0
  const prog = progressBadge(done, o.min_count)
  const ls = LEVEL_STYLE[o.required_level]
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{p?.name ?? '—'}</p>
          {p?.pathologie && <p className="text-xs text-slate-500 mt-0.5">{p.pathologie}</p>}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {cat && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: cat.color_hex + '25', color: cat.color_hex }}>
                {cat.name}
              </span>
            )}
            {ls && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: ls.bg, color: ls.color }}>
                {LEVELS[o.required_level]}
              </span>
            )}
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
          style={{ backgroundColor: prog.bg, color: prog.color }}>
          {prog.text}
        </span>
      </div>
    </div>
  )
}

export default async function ReferentielPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const tab = params?.tab ?? 'objectifs'

  const { data: profile } = await supabase
    .from('profiles').select('residanat_start_date').eq('id', user.id).single()
  const residentYear = getResidentYear(profile?.residanat_start_date)

  // Filtres onglet "Mes objectifs"
  const filterCat = params?.cat ?? ''
  const filterLevel = params?.level ?? ''

  // Filtres onglet "Référentiel"
  const refYear = params?.year ? parseInt(params.year) : 1
  const refLevel = params?.level ?? ''

  // Récupérer les réalisations validées (communes aux deux onglets)
  const { data: validated } = await supabase
    .from('realisations').select('procedure_id')
    .eq('resident_id', user.id).eq('status', 'validated')

  const validatedCounts = {}
  ;(validated ?? []).forEach(r => {
    validatedCounts[r.procedure_id] = (validatedCounts[r.procedure_id] ?? 0) + 1
  })

  // ── Onglet Mes objectifs ──
  let myObjectives = []
  let categories = []
  if (tab === 'objectifs') {
    const [objRes, catRes] = await Promise.all([
      supabase
        .from('procedure_objectives')
        .select('procedure_id, required_level, min_count, procedures(id, name, pathologie, category_id, categories(name, color_hex))')
        .eq('year', residentYear),
      supabase.from('categories').select('id, name, color_hex').order('display_order'),
    ])
    categories = catRes.data ?? []
    myObjectives = (objRes.data ?? []).filter(o => {
      if (filterCat && o.procedures?.category_id !== filterCat) return false
      if (filterLevel && String(o.required_level) !== filterLevel) return false
      return true
    })
  }

  // ── Onglet Référentiel ──
  let refObjectives = []
  if (tab === 'referentiel') {
    const { data: refObjs } = await supabase
      .from('procedure_objectives')
      .select('procedure_id, required_level, min_count, procedures(id, name, pathologie, category_id, categories(name, color_hex))')
      .eq('year', refYear)
    refObjectives = (refObjs ?? []).filter(o => {
      if (refLevel && String(o.required_level) !== refLevel) return false
      return true
    })
  }

  function tabHref(t) {
    if (t === 'objectifs') return '/resident/referentiel'
    return `/resident/referentiel?tab=referentiel&year=1`
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader
        title="Objectifs"
        subtitle={tab === 'objectifs'
          ? `Année ${residentYear} — ${myObjectives.length} geste(s)`
          : `Année ${refYear} — ${refObjectives.length} geste(s)`
        }
      />

      {/* Onglets */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ backgroundColor: '#e2e8f0' }}>
        {[
          { value: 'objectifs',   label: 'Mes objectifs' },
          { value: 'referentiel', label: 'Référentiel' },
        ].map(t => (
          <Link
            key={t.value}
            href={tabHref(t.value)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={tab === t.value
              ? { backgroundColor: 'white', color: '#0D2B4E', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { color: '#64748b' }
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── Mes objectifs ── */}
      {tab === 'objectifs' && (
        <>
          <ReferentielFilters
            filterCat={filterCat}
            filterLevel={filterLevel}
            categories={categories}
          />
          <div className="space-y-2">
            {myObjectives.map((o, i) => (
              <GestCard key={i} o={o} validatedCounts={validatedCounts} />
            ))}
            {myObjectives.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">Aucun objectif pour ces critères</p>
            )}
          </div>
        </>
      )}

      {/* ── Référentiel ── */}
      {tab === 'referentiel' && (
        <>
          <RefYearFilter refYear={refYear} refLevel={refLevel} />
          <div className="space-y-2">
            {refObjectives.map((o, i) => (
              <GestCard key={i} o={o} validatedCounts={validatedCounts} />
            ))}
            {refObjectives.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">Aucun objectif pour cette année</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
