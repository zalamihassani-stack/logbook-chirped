import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import { getResidentYear } from '@/lib/utils'
import { getResidentProgressRows, indexProgressByProcedure, getCountForRequiredLevel, procedureToGlobalObjective } from '@/lib/logbook'
import { normalizeTravailTypes } from '@/lib/travaux'
import { CheckCircle, Clock, FilePlus2, FlaskConical, ListChecks, Target, XCircle } from 'lucide-react'

const LEVELS = {
  1: { label: 'Exposition', bg: 'var(--color-info-light)', color: 'var(--color-info)' },
  2: { label: 'Supervision', bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  3: { label: 'Maitrise', bg: 'var(--color-success-light)', color: 'var(--color-success)' },
}

export default async function ResidentDashboard() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('residanat_start_date')
    .eq('id', user.id)
    .single()

  const year = getResidentYear(profile?.residanat_start_date)

  const { data: authorLinks } = await admin
    .from('travail_auteurs')
    .select('travail_id')
    .eq('profile_id', user.id)
  const authoredIds = Array.from(new Set((authorLinks ?? []).map((link) => link.travail_id).filter(Boolean)))

  const [
    progressRows,
    proceduresRes,
    totalRes,
    validatedRes,
    pendingRes,
    refusedRes,
    ownTravauxRes,
    authoredTravauxRes,
    typesRes,
  ] = await Promise.all([
    getResidentProgressRows(supabase, user.id),
    supabase
      .from('procedures')
      .select('id, objectif_final, target_level, target_count, target_year, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min')
      .eq('is_active', true),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'validated'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'pending'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('resident_id', user.id).eq('status', 'refused'),
    admin
      .from('travaux_scientifiques')
      .select('id, type_id, validation_status')
      .eq('resident_id', user.id),
    authoredIds.length > 0
      ? admin
        .from('travaux_scientifiques')
        .select('id, type_id, validation_status')
        .in('id', authoredIds)
      : Promise.resolve({ data: [] }),
    supabase.from('travail_types').select('id, name, color_hex').eq('is_active', true).order('display_order'),
  ])

  const progressIndex = indexProgressByProcedure(progressRows)
  const objectives = (proceduresRes.data ?? [])
    .map(procedureToGlobalObjective)
    .filter((objective) => objective?.required_level > 0)
  const levelStats = [1, 2, 3].map((level) => ({
    level,
    ...summarizeObjectives(objectives.filter((objective) => objective.required_level === level), progressIndex),
  }))

  const travaux = Array.from(new Map([...(ownTravauxRes.data ?? []), ...(authoredTravauxRes.data ?? [])].map((travail) => [travail.id, travail])).values())
  const travailTypes = normalizeTravailTypes(typesRes.data ?? [])
  const travauxPending = travaux.filter((travail) => ['pending_initial', 'pending_final'].includes(travail.validation_status)).length
  const travailTypeStats = travailTypes.map((type) => ({
    ...type,
    count: travaux.filter((travail) => travail.type_id === type.id).length,
  }))

  return (
    <div className="max-w-6xl p-5 md:p-8">
      <PageHeader
        title="Mon tableau de bord"
        subtitle={`Année ${year} de résidanat`}
        action={
          <Link
            href="/resident/nouveau"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-95 sm:px-4 bg-navy"
          >
            <FilePlus2 size={16} strokeWidth={2} />
            Ajouter un acte
          </Link>
        }
      />

      <DashboardSection title="Mes actes" columns="grid-cols-2 lg:grid-cols-4">
        <StatCard href="/resident/historique" icon={ListChecks} label="Total saisis" value={totalRes.count ?? 0} tone="primary" />
        <StatCard href="/resident/historique?status=validated" icon={CheckCircle} label="Validés" value={validatedRes.count ?? 0} tone="success" />
        <StatCard href="/resident/historique?status=pending" icon={Clock} label="En attente" value={pendingRes.count ?? 0} tone="warning" />
        <StatCard href="/resident/historique?status=refused" icon={XCircle} label="Refusés" value={refusedRes.count ?? 0} tone="danger" />
      </DashboardSection>

      <DashboardSection title="Ma progression" columns="grid-cols-3">
        {levelStats.map((stat) => {
          const style = LEVELS[stat.level]
          return (
            <ProgressStat
              key={stat.level}
              href={`/resident/progression?scope=formation&level=${stat.level}`}
              label={style.label}
              done={stat.done}
              total={stat.total}
              pct={stat.pct}
              bg={style.bg}
              color={style.color}
            />
          )
        })}
      </DashboardSection>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Mes travaux</h2>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <StatCard href="/resident/travaux?validation=pending" icon={Clock} label="En cours" value={travauxPending} tone="warning" />
          <StatCard href="/resident/travaux" icon={FlaskConical} label="Soumis" value={travaux.length} tone="primary" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {travailTypeStats.map((type) => (
            <StatCard
              key={type.id}
              href={`/resident/travaux?type=${type.id}`}
              icon={FlaskConical}
              label={type.name}
              value={type.count}
              customColor={type.color_hex}
            />
          ))}
        </div>
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

function DashboardSection({ title, children, columns = 'grid-cols-2 lg:grid-cols-4' }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>{title}</h2>
      <div className={`grid gap-3 ${columns}`}>
        {children}
      </div>
    </section>
  )
}

function StatCard({ href, icon: Icon, label, value, tone = 'primary', customColor }) {
  const styles = {
    primary: { bg: 'var(--color-ice)', color: 'var(--color-navy)' },
    success: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
    warning: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
    danger: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
  }[tone]
  const color = customColor ?? styles.color
  const bg = customColor ? `${customColor}20` : styles.bg

  return (
    <Link href={href} className="min-w-0 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:shadow-md sm:p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10" style={{ backgroundColor: bg, color }}>
        <Icon size={17} strokeWidth={1.8} />
      </div>
      <p className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-navy)' }}>{value}</p>
      <p className="mt-0.5 truncate text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
    </Link>
  )
}

function ProgressStat({ href, label, done, total, pct, bg, color }) {
  return (
    <Link href={href} className="min-w-0 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm transition hover:shadow-md sm:p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl sm:h-10 sm:w-10" style={{ backgroundColor: bg, color }}>
        <Target size={16} strokeWidth={1.8} />
      </div>
      <p className="truncate text-[11px] font-semibold sm:text-sm" style={{ color }}>{label}</p>
      <p className="mt-1 text-lg font-bold sm:text-3xl" style={{ color: 'var(--color-navy)' }}>{done}/{total}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 sm:mt-3 sm:h-2">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </Link>
  )
}
