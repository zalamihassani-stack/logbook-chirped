import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { getResidentYear } from '@/lib/utils'
import { buildCurriculumObjectives, enrichObjectiveProgress } from '@/lib/logbook'
import ResidentDetail from './ResidentDetail'

export default async function ResidentFichePage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: resident },
    { data: realisations },
    { data: objectiveRows },
    { data: procedures },
    { data: progressRows },
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).single(),
    admin
      .from('realisations')
      .select('id, performed_at, activity_type, status, procedure_id, procedures(name, id), profiles!enseignant_id(full_name)')
      .eq('resident_id', id)
      .order('performed_at', { ascending: false }),
    supabase
      .from('procedure_objectives')
      .select('procedure_id, year, required_level, min_count')
      .eq('is_active', true),
    supabase
      .from('procedures')
      .select('id, name, pathologie, objectif_final, target_level, target_count, target_year, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, seuil_deblocage_autonomie, categories(name, color_hex)')
      .eq('is_active', true),
    admin
      .from('v_resident_niveau')
      .select('procedure_id, count_expose, count_supervise, count_autonome, niveau_atteint')
      .eq('resident_id', id),
  ])

  if (!resident) notFound()

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
