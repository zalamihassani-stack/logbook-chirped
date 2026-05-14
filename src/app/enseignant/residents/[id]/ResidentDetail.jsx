'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, Target } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import ExportFicheButton from './ExportFicheButton'
import { ACTIVITY_TYPE_LABELS, OBJECTIF_LEVEL_LABELS } from '@/lib/logbook'
import { formatDate, getInitials } from '@/lib/utils'

const LEVELS = [
  { key: '3', label: 'Autonomie', shortLabel: 'Autonomie', color: 'var(--color-success)', bg: 'var(--color-success-light)' },
  { key: '2', label: 'Sous supervision', shortLabel: 'Supervision', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
  { key: '1', label: 'Exposition', shortLabel: 'Exposition', color: 'var(--color-info)', bg: 'var(--color-info-light)' },
]

const TABS = [
  { key: 'progression', label: 'Progression', icon: Target },
  { key: 'historique', label: 'Historique', icon: BookOpen },
]

function getLevelStyle(level) {
  return LEVELS.find((item) => item.key === String(level)) ?? LEVELS[0]
}

function getObjectiveIntro(objective) {
  if (objective.required_level === 1) return 'Transversal'
  return `A${objective.year}`
}

function sortObjectives(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1
  if (a.required_level !== b.required_level) return b.required_level - a.required_level
  if (a.required_level !== 1 && b.required_level !== 1 && a.year !== b.year) return a.year - b.year
  if (a.pct !== b.pct) return a.pct - b.pct
  return (a.procedures?.name ?? '').localeCompare(b.procedures?.name ?? '')
}

function buildLevelSummary(objectives) {
  return LEVELS.map((level) => {
    const items = objectives.filter((objective) => String(objective.required_level) === level.key)
    const done = items.filter((objective) => objective.done).length
    const total = items.length
    const late = items.filter((objective) => !objective.done).length
    const pct = total ? Math.round((done / total) * 100) : 0

    return { ...level, done, total, late, pct }
  })
}

export default function ResidentDetail({
  resident, realisations, yearlyObjectives, exposureObjectives, stats, year,
}) {
  const [tab, setTab] = useState('progression')
  const allObjectives = useMemo(() => [...yearlyObjectives, ...exposureObjectives], [yearlyObjectives, exposureObjectives])
  const summary = useMemo(() => buildLevelSummary(allObjectives), [allObjectives])
  const doneTotal = summary.reduce((sum, item) => sum + item.done, 0)
  const objectiveTotal = summary.reduce((sum, item) => sum + item.total, 0)
  const objectivePct = objectiveTotal ? Math.round((doneTotal / objectiveTotal) * 100) : 0

  return (
    <div className="max-w-5xl p-5 md:p-8">
      <Link
        href="/enseignant/suivi"
        className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:shadow-md"
        style={{ color: 'var(--color-navy)' }}
      >
        <ArrowLeft size={16} />
        Retour au suivi
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-bold"
          style={{ backgroundColor: 'var(--color-ice)', color: 'var(--color-navy)' }}>
          {getInitials(resident.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-navy)' }}>{resident.full_name}</h1>
          <p className="text-sm text-slate-500">Année {year} · Promo {resident.promotion ?? '-'}</p>
        </div>
        <ExportFicheButton resident={resident} realisations={realisations} year={year} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, bg: 'var(--color-ice)', color: 'var(--color-navy)' },
          { label: 'Validés', value: stats.validated, bg: 'var(--color-success-light)', color: 'var(--color-success)' },
          { label: 'En attente', value: stats.pending, bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
          { label: 'Refusés', value: stats.refused, bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const count = key === 'historique' ? realisations.length : null
          const active = tab === key
          return (
            <button key={key} onClick={() => setTab(key)}
              className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={active ? { backgroundColor: 'var(--color-navy)', color: 'white' } : { color: '#64748b' }}>
              <Icon size={14} strokeWidth={active ? 2.25 : 1.75} />
              <span>{label}</span>
              {count !== null && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  style={active ? { backgroundColor: 'rgba(255,255,255,0.16)', color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'progression' && (
        <ProgressionTab
          objectives={allObjectives}
          summary={summary}
          doneTotal={doneTotal}
          objectiveTotal={objectiveTotal}
          objectivePct={objectivePct}
        />
      )}
      {tab === 'historique' && <HistoriqueTab realisations={realisations} />}
    </div>
  )
}

function ProgressionTab({ objectives, summary, doneTotal, objectiveTotal, objectivePct }) {
  const [selectedLevel, setSelectedLevel] = useState('3')
  const selectedSummary = summary.find((item) => item.key === selectedLevel) ?? summary[0]
  const rows = objectives
    .filter((objective) => String(objective.required_level) === selectedLevel)
    .sort(sortObjectives)

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
              Progression globale
            </p>
          </div>
          <span className="text-lg font-bold" style={{ color: 'var(--color-navy)' }}>{objectivePct}%</span>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full" style={{ width: `${objectivePct}%`, backgroundColor: 'var(--color-navy)' }} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {summary.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedLevel(item.key)}
              className="rounded-xl border p-3 text-left transition hover:shadow-sm active:scale-[0.99]"
              style={selectedLevel === item.key
                ? { borderColor: item.color, backgroundColor: item.bg }
                : { borderColor: '#f1f5f9', backgroundColor: '#fff' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold" style={{ color: item.color }}>{item.label}</span>
                <span className="text-sm font-bold" style={{ color: item.color }}>{item.done}/{item.total}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{item.pct}% atteint</p>
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {doneTotal}/{objectiveTotal} objectifs atteints
        </p>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold" style={{ color: selectedSummary.color }}>
              Objectifs - {selectedSummary.label}
            </p>
          </div>
          {selectedSummary.late > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <AlertTriangle size={13} />
              {selectedSummary.late} restant{selectedSummary.late > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {rows.length === 0 ? (
          <p className="rounded-2xl border border-slate-100 bg-white py-8 text-center text-sm text-slate-400 shadow-sm">
            Aucun objectif dans ce niveau
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((objective) => <ObjectiveCard key={`${objective.procedure_id}-${objective.year}-${objective.required_level}`} objective={objective} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function ObjectiveCard({ objective }) {
  const style = getLevelStyle(objective.required_level)
  const procedure = objective.procedures
  const category = procedure?.categories
  const progressColor = objective.done ? style.color : objective.pct >= 66 ? 'var(--color-warning)' : objective.pct > 0 ? 'var(--color-danger)' : '#cbd5e1'

  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${objective.done ? 'border-emerald-100' : 'border-slate-100'}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: style.bg }}>
          {objective.done ? <CheckCircle2 size={16} style={{ color: style.color }} /> : <Target size={16} style={{ color: style.color }} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-800">{procedure?.name ?? 'Geste'}</p>
            <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: style.bg, color: style.color }}>
              {OBJECTIF_LEVEL_LABELS[objective.required_level]}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {getObjectiveIntro(objective)}
            </span>
            {category && (
              <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${category.color_hex}25`, color: category.color_hex }}>
                {category.name}
              </span>
            )}
          </div>
          {procedure?.pathologie && <p className="mt-0.5 text-xs text-slate-500">{procedure.pathologie}</p>}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${objective.pct}%`, backgroundColor: progressColor }} />
            </div>
            <span className="w-14 text-right text-xs font-semibold" style={{ color: progressColor }}>
              {objective.count}/{objective.min_count}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoriqueTab({ realisations }) {
  if (realisations.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">Aucun acte enregistré</p>
  }

  return (
    <div className="space-y-2">
      {realisations.map((realisation) => (
        <div key={realisation.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{realisation.procedures?.name ?? '-'}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatDate(realisation.performed_at)} · {ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '-'}
              {realisation.profiles?.full_name ? ` · ${realisation.profiles.full_name}` : ''}
            </p>
          </div>
          <Badge status={realisation.status} />
        </div>
      ))}
    </div>
  )
}
