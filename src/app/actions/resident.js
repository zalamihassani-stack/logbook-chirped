'use server'
import { createClient } from '@/lib/supabase/server'
import { getResidentYear } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

export async function createRealisation(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('residanat_start_date').eq('id', user.id).single()

  const residentYear = getResidentYear(profile?.residanat_start_date)

  // Vérifie si le geste est dans les objectifs de l'année
  const { data: obj } = await supabase
    .from('procedure_objectives')
    .select('id')
    .eq('procedure_id', formData.procedure_id)
    .eq('year', residentYear)
    .maybeSingle()

  const isHorsObjectifs = !obj

  const { data: real, error } = await supabase.from('realisations').insert({
    resident_id: user.id,
    procedure_id: formData.procedure_id,
    enseignant_id: formData.enseignant_id,
    superviseur_resident_id: formData.superviseur_resident_id || null,
    performed_at: formData.performed_at,
    resident_year_at_time: residentYear,
    participation_level: formData.participation_level,
    ipp_patient: formData.ipp_patient || null,
    compte_rendu: formData.compte_rendu || null,
    commentaire: formData.commentaire || null,
    status: 'pending',
    is_hors_objectifs: isHorsObjectifs,
  }).select('id').single()
  if (error) return { error: error.message }

  await supabase.from('validation_history').insert({
    realisation_id: real.id, enseignant_id: formData.enseignant_id, action: 'submitted',
  })
  await supabase.from('notifications').insert({
    user_id: formData.enseignant_id, realisation_id: real.id, type: 'new_submission', is_read: false,
  })
  revalidatePath('/resident/historique')
  return { success: true, id: real.id }
}

export async function resubmitRealisation(id, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('realisations').update({
    procedure_id: formData.procedure_id,
    enseignant_id: formData.enseignant_id,
    performed_at: formData.performed_at,
    participation_level: formData.participation_level,
    ipp_patient: formData.ipp_patient || null,
    compte_rendu: formData.compte_rendu || null,
    commentaire: formData.commentaire || null,
    status: 'pending',
  }).eq('id', id).eq('resident_id', user.id)
  if (error) return { error: error.message }

  await supabase.from('validation_history').insert({
    realisation_id: id, enseignant_id: formData.enseignant_id, action: 'resubmitted',
  })
  await supabase.from('notifications').insert({
    user_id: formData.enseignant_id, realisation_id: id, type: 'new_submission', is_read: false,
  })
  revalidatePath(`/resident/historique/${id}`)
  return { success: true }
}

// ─── Travaux scientifiques ────────────────────────────────────
export async function createTravail(data) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('travaux_scientifiques').insert({ ...data, resident_id: user.id })
  if (error) return { error: error.message }
  revalidatePath('/resident/travaux')
  return { success: true }
}

export async function updateTravail(id, data) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('travaux_scientifiques').update(data)
    .eq('id', id).eq('resident_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/resident/travaux')
  revalidatePath(`/resident/travaux/${id}`)
  return { success: true }
}

export async function deleteTravail(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('travaux_scientifiques').delete()
    .eq('id', id).eq('resident_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/resident/travaux')
  return { success: true }
}
