'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireEnseignant() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Authentification requise.')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'enseignant') {
    throw new Error('Accès enseignant requis.')
  }

  return { supabase, user }
}

export async function validateRealisation(id, feedback) {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireEnseignant())
  } catch (error) {
    return { error: error.message }
  }
  const admin = createAdminClient()

  const { data: real, error } = await supabase
    .from('realisations')
    .update({ status: 'validated' })
    .eq('id', id)
    .eq('enseignant_id', user.id)
    .select('resident_id')
    .single()
  if (error) return { error: error.message }

  const { error: historyError } = await admin.from('validation_history').insert({
    realisation_id: id,
    enseignant_id: user.id,
    action: 'validated',
    feedback,
  })
  if (historyError) return { error: historyError.message }

  const { error: notificationError } = await admin.from('notifications').insert({
    user_id: real.resident_id,
    realisation_id: id,
    type: 'validated',
    is_read: false,
  })
  if (notificationError) return { error: notificationError.message }

  revalidatePath('/enseignant/demandes')
  return { success: true }
}

export async function refuseRealisation(id, feedback) {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireEnseignant())
  } catch (error) {
    return { error: error.message }
  }
  const admin = createAdminClient()

  const { data: real, error } = await supabase
    .from('realisations')
    .update({ status: 'refused' })
    .eq('id', id)
    .eq('enseignant_id', user.id)
    .select('resident_id')
    .single()
  if (error) return { error: error.message }

  const { error: historyError } = await admin.from('validation_history').insert({
    realisation_id: id,
    enseignant_id: user.id,
    action: 'refused',
    feedback,
  })
  if (historyError) return { error: historyError.message }

  const { error: notificationError } = await admin.from('notifications').insert({
    user_id: real.resident_id,
    realisation_id: id,
    type: 'refused',
    is_read: false,
  })
  if (notificationError) return { error: notificationError.message }

  revalidatePath('/enseignant/demandes')
  return { success: true }
}

export async function validateTravail(id, feedback = '') {
  let user
  try {
    ;({ user } = await requireEnseignant())
  } catch (error) {
    return { error: error.message }
  }
  const admin = createAdminClient()

  const { data: travail, error: readError } = await admin
    .from('travaux_scientifiques')
    .select('validation_status')
    .eq('id', id)
    .maybeSingle()
  if (readError) return { error: formatTravailValidationError(readError) }
  if (!travail) return { error: 'Travail introuvable.' }

  const now = new Date().toISOString()
  const next =
    travail.validation_status === 'pending_final'
      ? {
          validation_status: 'final_validated',
          final_validated_by: user.id,
          final_validated_at: now,
          validation_feedback: feedback || null,
        }
      : {
          validation_status: 'initial_validated',
          initial_validated_by: user.id,
          initial_validated_at: now,
          validation_feedback: feedback || null,
        }

  const { error } = await admin
    .from('travaux_scientifiques')
    .update(next)
    .eq('id', id)
  if (error) return { error: formatTravailValidationError(error) }

  const { error: historyError } = await admin.from('travail_validation_history').insert({
    travail_id: id,
    enseignant_id: user.id,
    action: next.validation_status,
    feedback: feedback || null,
  })
  if (historyError) return { error: formatTravailValidationError(historyError) }

  revalidatePath('/enseignant/travaux')
  revalidatePath('/resident/travaux')
  revalidatePath(`/resident/travaux/${id}`)
  return { success: true }
}

export async function refuseTravail(id, feedback = '') {
  let user
  try {
    ;({ user } = await requireEnseignant())
  } catch (error) {
    return { error: error.message }
  }
  const admin = createAdminClient()

  const { error } = await admin
    .from('travaux_scientifiques')
    .update({
      validation_status: 'refused',
      validation_feedback: feedback || null,
    })
    .eq('id', id)
  if (error) return { error: formatTravailValidationError(error) }

  const { error: historyError } = await admin.from('travail_validation_history').insert({
    travail_id: id,
    enseignant_id: user.id,
    action: 'refused',
    feedback: feedback || null,
  })
  if (historyError) return { error: formatTravailValidationError(historyError) }

  revalidatePath('/enseignant/travaux')
  revalidatePath('/resident/travaux')
  revalidatePath(`/resident/travaux/${id}`)
  return { success: true }
}

function formatTravailValidationError(error) {
  const message = error?.message ?? ''
  if (message.includes('validation_status') || message.includes('travail_validation_history') || message.includes('schema cache')) {
    return "La structure Supabase des validations de travaux n'est pas encore à jour. Exécutez le script supabase/travaux_scientifiques_enhancements.sql dans Supabase."
  }
  return message
}
