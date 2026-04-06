import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import ObjectifsFilters from './ObjectifsFilters'

const LEVELS = { 1: 'Observation', 2: 'Aide opératoire', 3: 'Sous supervision', 4: 'Autonome' }
const LEVEL_STYLE = {
  3: { bg: '#ffedd5', color: '#9a3412' },
  4: { bg: '#dcfce7', color: '#166534' },
}
const ALL_LEVEL_STYLE = {
  1: { bg: '#f1f5f9', color: '#475569' },
  2: { bg: '#dbeafe', color: '#1e40af' },
  3: { bg: '#ffedd5', color: '#9a3412' },
  4: { bg: '#dcfce7', color: '#166534' },
}

export default async function ObjectifsPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const tab = params?.tab ?? 'objectifs'
  const year = parseInt(params?.year ?? '1')
  const filterCat = params?.cat ?? ''

  const { data: categories } = await supabase
    .from('categories').select('id, name, color_hex').order('display_order')

  // ── Onglet Objectifs : niveaux 3 et 4 pour l'année sélectionnée ──
  let supervision = [], autonome = []
  if (tab === 'objectifs') {
    const { data: objectives } = await supabase
      .from('procedure_objectives')
      .select('required_level, min_count, procedures(id, name, pathologie, category_id, categories(name, color_hex))')
      .eq('year', year)
      .in('required_level', [3, 4])

    const filtered = (objectives ?? []).filter(o =>
      !filterCat || o.procedures?.category_id === filterCat
    )
    supervision = filtered.filter(o => o.required_level === 3)
    autonome    = filtered.filter(o => o.required_level === 4)
  }

  // ── Onglet Référentiel : tous les gestes, tous les objectifs ──
  let referentiel = []
  if (tab === 'referentiel') {
    const { data: allObjectives } = await supabase
      .from('procedure_objectives')
      .select('year, required_level, min_count, procedures(id, name, pathologie, category_id, categories(name, color_hex))')
      .order('year')

    // Grouper par procédure
    const map = new Map()
    for (const o of (allObjectives ?? [])) {
      if (!o.procedures) continue
      if (filterCat && o.procedures.category_id !== filterCat) continue
      const pid = o.procedures.id
      if (!map.has(pid)) map.set(pid, { ...o.procedures, years: [] })
      map.get(pid).years.push({ year: o.year, required_level: o.required_level, min_count: o.min_count })
    }
    referentiel = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }

  function tabHref(t) {
    const p = new URLSearchParams({ tab: t, year, ...(filterCat && { cat: filterCat }) })
    return `/enseignant/objectifs?${p}`
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <PageHeader title="Objectifs de formation" subtitle="" />

      {/* Onglets */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ backgroundColor: '#e2e8f0' }}>
        {[
          { value: 'objectifs',   label: 'Objectifs' },
          { value: 'referentiel', label: 'Référentiel' },
        ].map(t => (
          <Link
            key={t.value}
            href={tabHref(t.value)}
            className="px-5 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={tab === t.value
              ? { backgroundColor: 'white', color: '#0D2B4E', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { color: '#64748b' }
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── Onglet Objectifs ── */}
      {tab === 'objectifs' && (
        <>
          <ObjectifsFilters
            year={year}
            filterCat={filterCat}
            categories={categories ?? []}
            tab="objectifs"
          />

          {/* Sous supervision */}
          <section className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#ea580c' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#9a3412' }}>
                Sous supervision
                <span className="ml-2 text-xs font-normal text-slate-400">({supervision.length})</span>
              </h2>
            </div>
            <div className="space-y-2">
              {supervision.map((o, i) => (
                <GestCard key={i} o={o} ls={LEVEL_STYLE[3]} />
              ))}
              {supervision.length === 0 && (
                <p className="text-sm text-slate-400 py-3 text-center">Aucun geste pour cette année</p>
              )}
            </div>
          </section>

          {/* Autonome */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#16a34a' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#166534' }}>
                Autonome
                <span className="ml-2 text-xs font-normal text-slate-400">({autonome.length})</span>
              </h2>
            </div>
            <div className="space-y-2">
              {autonome.map((o, i) => (
                <GestCard key={i} o={o} ls={LEVEL_STYLE[4]} />
              ))}
              {autonome.length === 0 && (
                <p className="text-sm text-slate-400 py-3 text-center">Aucun geste pour cette année</p>
              )}
            </div>
          </section>
        </>
      )}

      {/* ── Onglet Référentiel ── */}
      {tab === 'referentiel' && (
        <>
          {/* Filtre spécialité uniquement */}
          <div className="mb-5">
            <ObjectifsFilters
              year={year}
              filterCat={filterCat}
              categories={categories ?? []}
              tab="referentiel"
            />
          </div>

          <div className="space-y-3">
            {referentiel.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="mb-2">
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  {p.pathologie && <p className="text-xs text-slate-500 mt-0.5">{p.pathologie}</p>}
                  {p.categories && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                      style={{ backgroundColor: p.categories.color_hex + '25', color: p.categories.color_hex }}>
                      {p.categories.name}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {p.years.map(y => {
                    const ls = ALL_LEVEL_STYLE[y.required_level] ?? { bg: '#f1f5f9', color: '#64748b' }
                    return (
                      <span key={y.year} className="text-xs px-2.5 py-1 rounded-lg font-medium border"
                        style={{ backgroundColor: ls.bg, color: ls.color, borderColor: ls.bg }}>
                        Année {y.year} · {LEVELS[y.required_level]} · min.{y.min_count}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
            {referentiel.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">Aucun geste dans le référentiel</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function GestCard({ o, ls }) {
  const p = o.procedures
  const cat = p?.categories
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{p?.name ?? '—'}</p>
          {p?.pathologie && <p className="text-xs text-slate-500 mt-0.5">{p.pathologie}</p>}
          {cat && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
              style={{ backgroundColor: cat.color_hex + '25', color: cat.color_hex }}>
              {cat.name}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {ls && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: ls.bg, color: ls.color }}>
              min. {o.min_count}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
