import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { getResidentYear } from '@/lib/utils'
import { buildCurriculumObjectives, enrichObjectiveProgress, normalizeService } from '@/lib/logbook'
import ResidentDetail from './ResidentDetail'

export default async function ResidentFichePage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('service')
    .eq('id', user.id)
    .single()
  const teacherService = normalizeService(profile?.service)

  const proceduresQuery = supabase
    .from('procedures')
    .select('id, name, pathologie, objectif_final, target_level, target_count, target_year, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, seuil_deblocage_autonomie, categories(name, color_hex)')
    .eq('is_active', true)
    .eq('service', teacherService)

  const [
    { data: resident },
    { data: realisations },
    { data: procedures },
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).single(),
    admin
      .from('realisations')
      .select('id, performed_at, activity_type, status, procedure_id, procedures!inner(name, id, service), profiles!enseignant_id(full_name)')
      .eq('resident_id', id)
      .eq('procedures.service', teacherService)
      .order('performed_at', { ascending: false }),
    proceduresQuery,
  ])

  if (!resident) notFound()

  const procedureIds = (procedures ?? []).map((procedure) => procedure.id)
  const [{ data: objectiveRows }, { data: progressRows }] = await Promise.all([
    procedureIds.length
      ? supabase
        .from('procedure_objectives')
        .select('procedure_id, year, required_level, min_count')
        .eq('is_active', true)
        .in('procedure_id', procedureIds)
      : Promise.resolve({ data: [] }),
    procedureIds.length
      ? admin
        .from('v_resident_niveau')
        .select('procedure_id, count_expose, count_supervise, count_autonome, niveau_atteint')
        .eq('resident_id', id)
        .in('procedure_id', procedureIds)
      : Promise.resolve({ data: [] }),
  ])

  const year = getResidentYear(resident.residanat_start_date)
  const progressIndex = Object.fromEntries((progressRows ?? []).map((row) => [row.procedure_id, row]))
  const realisationsArr = realisations ?? []
  const curriculum = buildCurriculumObjectives({
    procedures: procedures ?? [],
    objectiveRows: objectiveRows ?? [],
  })
  const exposureObjectives = enrichObjectiveProgress(curriculum.exposure, progressIndex)
  const yearlyObjectives = enrichObjectiveProgress(curriculum.yearly, progressIndex)

  return (
    <ResidentDetail
      resident={resident}
      realisations={realisationsArr}
      yearlyObjectives={yearlyObjectives}
      exposureObjectives={exposureObjectives}
      year={year}
    />
  )
}
