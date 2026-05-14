import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import { formatDate, getResidentYear } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS, getResidentProgressRows, indexProgressByProcedure, getCountForRequiredLevel, procedureToGlobalObjective } from '@/lib/logbook'
import { TRAVAIL_VALIDATION_LABELS, TRAVAIL_VALIDATION_STYLES } from '@/lib/travaux'
import { AlertTriangle, CheckCircle, ChevronRight, Clock, FilePlus2, FlaskConical, Target, TrendingUp, XCircle } from 'lucide-react'

const LEVEL_COLORS = {
  1: { bg: 'var(--color-info-light)', color: 'var(--color-info)', label: 'Exposition' },
  2: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', label: 'Supervisé' },
  3: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: 'Autonome' },
}

export default async function ResidentDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('residanat_start_date, full_name')
    .eq('id', user.id)
    .single()

  const year = getResidentYear(profile?.residanat_start_date)

  const [progressRows, objectivesRes, proceduresRes, categoriesRes, pendingRealsRes, refusedRealsRes, validatedRes, pendingRes, totalRes, refusedRes, pendingTravauxRes, refusedTravauxRes, recentTravauxRes] = await Promise.all([
    getResidentProgressRows(supabase, user.id),
    supabase
      .from('procedure_objectives')
      .select('procedure_id, year, min_count, required_level, procedures(id, name, category_id, categories(name, color_hex))')
      .eq('is_active', true),
    supabase
      .from('procedures')
      .select('id, name, pathologie, category_id, objectif_final, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, categories(name, color_hex)')
      .eq('is_active', true),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
    supabase
      .from('realisations')
      .select('id, performed_at, activity_type, status, procedures(name)')
      .eq('resident_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('realisations')
      .select('id, performed_at, activity_type, status, procedures(name)')
      .eq('resident_id', user.id)
      .eq('status', 'refused')
      .order('updated_at', { ascending: false })
      .limit(3),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'validated'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'pending'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'refused'),
    supabase.from('travaux_scientifiques').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).in('validation_status', ['pending_initial', 'pending_final']),
    supabase.from('travaux_scientifiques').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('validation_status', 'refused'),
    supabase
      .from('travaux_scientifiques')
      .select('id, title, year, validation_status, encadrant:profiles!encadrant_id(full_name)')
      .eq('resident_id', user.id)
      .in('validation_status', ['pending_initial', 'pending_final', 'refused'])
      .order('year', { ascending: false })
      .limit(4),
  ])

  const progressIndex = indexProgressByProcedure(progressRows)
  const allObjectives = (objectivesRes.data ?? []).filter((objective) => objective.required_level > 0)
  const objectives = allObjectives.filter((objective) => objective.year === year)
  const globalObjectives = (proceduresRes.data ?? [])
    .map(procedureToGlobalObjective)
    .filter((objective) => objective.required_level > 0)
  const categories = categoriesRes.data ?? []
  const pendingReals = pendingRealsRes.data ?? []
  const refusedReals = refusedRealsRes.data ?? []
  const recentTravaux = recentTravauxRes.data ?? []

  const stats = {
    validated: validatedRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    total: totalRes.count ?? 0,
    refused: refusedRes.count ?? 0,
    travauxPending: pendingTravauxRes.count ?? 0,
    travauxRefused: refusedTravauxRes.count ?? 0,
  }

  const annual = summarizeObjectives(objectives, progressIndex)
  const global = summarizeObjectives(globalObjectives, progressIndex)
  const yearRoadmap = [1, 2, 3, 4, 5].map((targetYear) => ({
    year: targetYear,
    ...summarizeObjectives(allObjectives.filter((objective) => objective.year === targetYear), progressIndex),
  }))

  const levelStats = [1, 2, 3].map((level) => ({
    level,
    ...summarizeObjectives(objectives.filter((objective) => objective.required_level === level), progressIndex),
  }))

  const catProgress = categories
    .map((category) => ({
      ...category,
      ...summarizeObjectives(objectives.filter((objective) => objective.procedures?.category_id === category.id), progressIndex),
    }))
    .filter((category) => category.total > 0)

  const notMet = objectives
    .map((objective) => withProgress(objective, progressIndex))
    .filter((objective) => objective.missing > 0)
    .sort((a, b) => a.missing - b.missing || b.pct - a.pct)
    .slice(0, 5)

  const priorityItems = [
    stats.refused > 0 && {
      title: `${stats.refused} acte(s) refusé(s) à corriger`,
      detail: 'À reprendre en priorité pour débloquer votre historique.',
      href: '/resident/historique?status=refused',
      icon: XCircle,
      tone: 'danger',
    },
    stats.pending > 0 && {
      title: `${stats.pending} acte(s) en attente`,
      detail: 'Suivez les validations récentes et relancez si nécessaire.',
      href: '/resident/historique?status=pending',
      icon: Clock,
      tone: 'warning',
    },
    stats.travauxRefused > 0 && {
      title: `${stats.travauxRefused} travail/travaux à corriger`,
      detail: 'Ouvrez l’onglet travaux pour renvoyer la version corrigée.',
      href: '/resident/travaux',
      icon: FlaskConical,
      tone: 'danger',
    },
    stats.travauxPending > 0 && {
      title: `${stats.travauxPending} travail/travaux en validation`,
      detail: 'Suivez la validation initiale ou finale par l’encadrant.',
      href: '/resident/travaux',
      icon: FlaskConical,
      tone: 'warning',
    },
    notMet[0] && {
      title: `Prochain objectif: ${notMet[0].procedures?.name ?? 'objectif annuel'}`,
      detail: `${notMet[0].count}/${notMet[0].min_count} réalisé(s), ${notMet[0].missing} restant(s).`,
      href: '/resident/progression',
      icon: Target,
      tone: 'primary',
    },
  ].filter(Boolean)

  return (
    <div className="max-w-6xl p-5 md:p-8">
      <PageHeader
        title="Mon tableau de bord"
        subtitle={`Année ${year} de résidanat`}
        action={
          <Link
            href="/resident/nouveau"
            className="hidden items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-95 sm:inline-flex bg-navy"
          >
            <FilePlus2 size={16} strokeWidth={2} />
            Ajouter un acte
          </Link>
        }
      />

      <section className="mb-6 grid gap-5 lg:grid-cols-[1fr_1.25fr]">
        <ProgressCard href="/resident/progression" title="Progression de l'année" subtitle={`Objectifs A${year}`} summary={annual} />
        <Link href="/resident/progression?scope=formation" className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Progression globale</p>
              <p className="mt-0.5 text-xs text-slate-500">Tous les gestes actifs, selon leur objectif final</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: global.pct >= 80 ? 'var(--color-success)' : 'var(--color-navy)' }}>{global.pct}%</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full transition-all" style={{ width: `${global.pct}%`, backgroundColor: global.pct >= 80 ? 'var(--color-success)' : global.pct >= 50 ? 'var(--color-navy)' : 'var(--color-warning)' }} />
          </div>
          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-navy)' }}>
            {global.done}/{global.total} gestes au niveau attendu
          </p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {yearRoadmap.map((item) => (
              <div key={item.year} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                <p className="text-xs font-semibold" style={{ color: item.year === year ? 'var(--color-navy)' : '#64748b' }}>A{item.year}</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{item.done}/{item.total}</p>
              </div>
            ))}
          </div>
        </Link>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Niveaux attendus cette année</p>
          <Link href="/resident/progression" className="text-xs font-medium" style={{ color: 'var(--color-navy)' }}>Détail</Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {levelStats.map((stat) => {
            const color = LEVEL_COLORS[stat.level]
            return (
              <Link key={stat.level} href={`/resident/progression?level=${stat.level}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:bg-white">
                <p className="text-[11px] font-semibold" style={{ color: color.color }}>{color.label}</p>
                <p className="mt-1 text-lg font-bold text-slate-800">{stat.done}/{stat.total}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full" style={{ width: `${stat.pct}%`, backgroundColor: color.color }} />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mb-6 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>À faire maintenant</p>
              <p className="mt-0.5 text-xs text-slate-500">Actions prioritaires pour avancer</p>
            </div>
            <TrendingUp size={18} className="text-slate-400" />
          </div>

          <div className="space-y-2">
            {priorityItems.map((item) => <PriorityLink key={item.title} item={item} />)}
            {priorityItems.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                <CheckCircle size={28} className="text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Tout est à jour !</p>
                  <p className="mt-0.5 text-xs text-emerald-700">Aucune action urgente. Continuez sur votre lancée.</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/resident/nouveau" className="rounded-lg px-3 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: 'var(--color-navy)' }}>
                    Ajouter un acte
                  </Link>
                  <Link href="/resident/progression" className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-800">
                    Voir ma progression
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <ActivityPanel title="Refusés à corriger" href="/resident/historique?status=refused" empty="Aucun acte refusé – bien joué !">
            {refusedReals.map((realisation) => <RealisationRow key={realisation.id} realisation={realisation} icon={AlertTriangle} tone="danger" />)}
          </ActivityPanel>
          <ActivityPanel title="En attente de validation" href="/resident/historique?status=pending" empty="Pas d'acte en attente pour l'instant">
            {pendingReals.map((realisation) => <RealisationRow key={realisation.id} realisation={realisation} icon={Clock} tone="warning" />)}
          </ActivityPanel>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Travaux scientifiques</p>
            <p className="mt-0.5 text-xs text-slate-500">Validations en cours et corrections demandées</p>
          </div>
          <Link href="/resident/travaux" className="text-xs font-medium" style={{ color: 'var(--color-navy)' }}>Gérer</Link>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <MiniStat label="À valider" value={stats.travauxPending} color="var(--color-warning)" bg="var(--color-warning-light)" />
          <MiniStat label="Corrections" value={stats.travauxRefused} color="var(--color-danger)" bg="var(--color-danger-light)" />
        </div>
        <div className="space-y-2">
          {recentTravaux.map((travail) => <TravailRow key={travail.id} travail={travail} href={`/resident/travaux/${travail.id}`} />)}
          {recentTravaux.length === 0 && <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">Aucun travail en attente</p>}
        </div>
      </section>

      <section className="mb-6 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Objectifs de l&apos;année les plus proches</p>
            <Link href="/resident/progression" className="text-xs font-medium" style={{ color: 'var(--color-navy)' }}>Voir tout</Link>
          </div>
          <div className="space-y-2">
            {notMet.map((objective) => <ObjectiveProgress key={`${objective.procedure_id}-${objective.required_level}`} objective={objective} />)}
            {notMet.length === 0 && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                Tous les objectifs affichés pour cette année sont atteints.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Par catégorie cette année</p>
          <div className="space-y-3">
            {catProgress.map((category) => (
              <div key={category.id}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium" style={{ color: category.color_hex }}>{category.name}</span>
                  <span className="text-slate-500">{category.done}/{category.total}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${category.pct}%`, backgroundColor: category.color_hex }} />
                </div>
              </div>
            ))}
            {catProgress.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Aucun objectif annuel</p>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Validés" value={stats.validated} icon={CheckCircle} color="var(--color-success)" bg="var(--color-success-light)" href="/resident/historique?status=validated" />
        <StatTile label="En attente" value={stats.pending} icon={Clock} color="var(--color-warning)" bg="var(--color-warning-light)" href="/resident/historique?status=pending" />
        <StatTile label="Refusés" value={stats.refused} icon={XCircle} color="var(--color-danger)" bg="var(--color-danger-light)" href="/resident/historique?status=refused" />
        <StatTile label="Total actes" value={stats.total} icon={Target} color="var(--color-navy)" bg="var(--color-ice)" href="/resident/historique" />
      </section>
    </div>
  )
}

function summarizeObjectives(objectives, progressIndex) {
  const done = objectives.filter((objective) => {
    const count = getCountForRequiredLevel(progressIndex[objective.procedure_id], objective.required_level)
    return count >= objective.min_count
  }).length
  const total = objectives.length
  return { done, total, pct: total ? Math.min(100, Math.round((done / total) * 100)) : 0 }
}

function withProgress(objective, progressIndex) {
  const count = getCountForRequiredLevel(progressIndex[objective.procedure_id], objective.required_level)
  const missing = Math.max(0, objective.min_count - count)
  return { ...objective, count, missing, pct: objective.min_count ? Math.min(100, Math.round((count / objective.min_count) * 100)) : 0 }
}

function ProgressCard({ href, title, subtitle, summary }) {
  return (
    <Link href={href} className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>{title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      <p className="mt-4 text-4xl font-bold" style={{ color: summary.pct >= 80 ? 'var(--color-success)' : 'var(--color-navy)' }}>{summary.pct}%</p>
      <p className="mt-1 text-sm text-slate-500">{summary.done}/{summary.total} objectifs atteints</p>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all" style={{ width: `${summary.pct}%`, backgroundColor: summary.pct >= 80 ? 'var(--color-success)' : summary.pct >= 50 ? 'var(--color-navy)' : 'var(--color-warning)' }} />
      </div>
    </Link>
  )
}

function PriorityLink({ item }) {
  const Icon = item.icon
  const styles = {
    danger: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
    warning: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
    primary: { bg: 'var(--color-ice)', color: 'var(--color-navy)' },
  }[item.tone]

  return (
    <Link href={item.href} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:bg-white">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: styles.bg, color: styles.color }}>
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
      </div>
      <ChevronRight size={16} className="flex-shrink-0 text-slate-300" />
    </Link>
  )
}

function ActivityPanel({ title, href, empty, children }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>{title}</p>
        <Link href={href} className="text-xs font-medium" style={{ color: 'var(--color-navy)' }}>Tout voir</Link>
      </div>
      <div className="space-y-2">
        {hasChildren ? children : <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">{empty}</p>}
      </div>
    </div>
  )
}

function RealisationRow({ realisation, icon: Icon, tone }) {
  const color = tone === 'danger' ? 'var(--color-danger)' : 'var(--color-warning)'
  const bg = tone === 'danger' ? 'var(--color-danger-light)' : 'var(--color-warning-light)'
  return (
    <Link href={`/resident/historique/${realisation.id}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 transition hover:bg-slate-100">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: bg, color }}>
        <Icon size={15} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-800">{realisation.procedures?.name ?? '-'}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {formatDate(realisation.performed_at)} · {ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '-'}
        </p>
      </div>
      <ChevronRight size={13} className="flex-shrink-0 text-slate-300" />
    </Link>
  )
}

function MiniStat({ label, value, color, bg }) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: bg }}>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="mt-0.5 text-xs" style={{ color: `${color}cc` }}>{label}</p>
    </div>
  )
}

function TravailRow({ travail, href }) {
  const style = TRAVAIL_VALIDATION_STYLES[travail.validation_status] ?? { bg: '#f1f5f9', color: '#64748b' }
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 transition hover:bg-slate-100">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: style.bg, color: style.color }}>
        <FlaskConical size={15} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-800">{travail.title ?? '-'}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {travail.year} · {travail.encadrant?.full_name ?? 'Encadrant non renseigné'}
        </p>
      </div>
      <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: style.bg, color: style.color }}>
        {TRAVAIL_VALIDATION_LABELS[travail.validation_status] ?? travail.validation_status}
      </span>
    </Link>
  )
}

function ObjectiveProgress({ objective }) {
  const category = objective.procedures?.categories
  const level = LEVEL_COLORS[objective.required_level]
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug text-slate-800">{objective.procedures?.name ?? '-'}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {category && <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: `${category.color_hex}20`, color: category.color_hex }}>{category.name}</span>}
            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: level.bg, color: level.color }}>{level.label}</span>
          </div>
        </div>
        <span className="flex-shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{objective.count}/{objective.min_count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full transition-all" style={{ width: `${objective.pct}%`, backgroundColor: category?.color_hex ?? 'var(--color-navy)' }} />
      </div>
    </div>
  )
}

function StatTile({ label, value, icon: Icon, color, bg, href }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: bg, color }}>
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--color-navy)' }}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </Link>
  )
}
