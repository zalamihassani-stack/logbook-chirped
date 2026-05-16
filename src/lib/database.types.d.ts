export type ActivityType = 'expose' | 'supervise' | 'autonome'
export type RealisationStatus = 'pending' | 'validated' | 'refused'
export type ObjectifLevel = 1 | 2 | 3
export type NiveauAtteint = 0 | 1 | 2 | 3

export interface Procedure {
  id: string
  procedure_code: number
  category_id: string
  name: string
  pathologie: string | null
  objectif_final: ObjectifLevel
  target_level: ObjectifLevel | null
  target_count: number | null
  target_year: number | null
  seuil_exposition_min: number
  seuil_supervision_min: number
  seuil_autonomie_min: number
  seuil_deblocage_autonomie: number
  is_active: boolean
}

export interface Realisation {
  id: string
  resident_id: string
  procedure_id: string
  enseignant_id: string | null
  superviseur_resident_id: string | null
  activity_type: ActivityType
  performed_at: string
  resident_year_at_time: number | null
  ipp_patient: string | null
  compte_rendu: string | null
  commentaire: string | null
  status: RealisationStatus
  is_hors_objectifs: boolean
  created_at: string
  updated_at: string
}

export interface ResidentProgress {
  procedure_id: string
  procedure_code: number
  name: string
  category_name: string
  category_color: string
  objectif_final: ObjectifLevel
  target_level: ObjectifLevel | null
  target_count: number | null
  target_year: number | null
  seuil_exposition_min: number
  seuil_supervision_min: number
  seuil_autonomie_min: number
  seuil_deblocage_autonomie: number
  count_expose: number
  count_supervise: number
  count_autonome: number
  autonomie_debloquee: boolean
  niveau_atteint: NiveauAtteint
}
