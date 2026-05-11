'use server'
import { createClient } from '@/lib/supabase/server'
import { getResidentYear } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

async function requireResident() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Authentification requise.')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, residanat_start_date')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'resident') {
    throw new Error('Acces resident requis.')
  }

  return { supabase, user, profile }
}

export async function createRealisation(formData) {
  let supabase
  let user
  let profile
  try {
    ;({ supabase, user, profile } = await requireResident())
  } catch (error) {
    return { error: error.message }
  }

  const residentYear = getResidentYear(profile?.residanat_start_date)

  const { data: objective } = await supabase
    .from('procedure_objectives')
    .select('id')
    .eq('procedure_id', formData.procedure_id)
    .eq('year', residentYear)
    .maybeSingle()

  const { data: realisation, error } = await supabase
    .from('realisations')
    .insert({
      resident_id: user.id,
      procedure_id: formData.procedure_id,
      enseignant_id: formData.enseignant_id,
      superviseur_resident_id: formData.superviseur_resident_id || null,
      performed_at: formData.performed_at,
      resident_year_at_time: residentYear,
      activity_type: formData.activity_type,
      ipp_patient: formData.ipp_patient || null,
      compte_rendu: formData.compte_rendu || null,
      commentaire: formData.commentaire || null,
      status: 'pending',
      is_hors_objectifs: !objective,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  const { error: historyError } = await supabase.from('validation_history').insert({
    realisation_id: realisation.id,
    enseignant_id: formData.enseignant_id,
    action: 'submitted',
  })
  if (historyError) return { error: historyError.message }

  const { error: notificationError } = await supabase.from('notifications').insert({
    user_id: formData.enseignant_id,
    realisation_id: realisation.id,
    type: 'new_submission',
    is_read: false,
  })
  if (notificationError) {
    console.error('Notification enseignant non creee', notificationError)
  }

  revalidatePath('/resident/historique')
  revalidatePath('/enseignant')
  revalidatePath('/enseignant/demandes')
  return { success: true, id: realisation.id }
}

export async function resubmitRealisation(id, formData) {
  let supabase
  let user
  let profile
  try {
    ;({ supabase, user, profile } = await requireResident())
  } catch (error) {
    return { error: error.message }
  }

  const residentYear = getResidentYear(profile?.residanat_start_date)

  const { data: objective } = await supabase
    .from('procedure_objectives')
    .select('id')
    .eq('procedure_id', formData.procedure_id)
    .eq('year', residentYear)
    .maybeSingle()

  const { error } = await supabase
    .from('realisations')
    .update({
      procedure_id: formData.procedure_id,
      enseignant_id: formData.enseignant_id,
      performed_at: formData.performed_at,
      resident_year_at_time: residentYear,
      activity_type: formData.activity_type,
      ipp_patient: formData.ipp_patient || null,
      compte_rendu: formData.compte_rendu || null,
      commentaire: formData.commentaire || null,
      status: 'pending',
      is_hors_objectifs: !objective,
    })
    .eq('id', id)
    .eq('resident_id', user.id)
  if (error) return { error: error.message }

  const { error: historyError } = await supabase.from('validation_history').insert({
    realisation_id: id,
    enseignant_id: formData.enseignant_id,
    action: 'resubmitted',
  })
  if (historyError) return { error: historyError.message }

  const { error: notificationError } = await supabase.from('notifications').insert({
    user_id: formData.enseignant_id,
    realisation_id: id,
    type: 'new_submission',
    is_read: false,
  })
  if (notificationError) {
    console.error('Notification enseignant non creee', notificationError)
  }

  revalidatePath(`/resident/historique/${id}`)
  revalidatePath('/resident/historique')
  revalidatePath('/enseignant')
  revalidatePath('/enseignant/demandes')
  return { success: true }
}

export async function createTravail(data) {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireResident())
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase
    .from('travaux_scientifiques')
    .insert({ ...data, resident_id: user.id })
  if (error) return { error: error.message }

  revalidatePath('/resident/travaux')
  return { success: true }
}

export async function updateTravail(id, data) {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireResident())
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase
    .from('travaux_scientifiques')
    .update(data)
    .eq('id', id)
    .eq('resident_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/resident/travaux')
  revalidatePath(`/resident/travaux/${id}`)
  return { success: true }
}

export async function deleteTravail(id) {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireResident())
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase
    .from('travaux_scientifiques')
    .delete()
    .eq('id', id)
    .eq('resident_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/resident/travaux')
  return { success: true }
}
