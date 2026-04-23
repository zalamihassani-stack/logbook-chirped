'use server'
import { createClient } from '@/lib/supabase/server'
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
    throw new Error('Acces enseignant requis.')
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

  const { data: real, error } = await supabase
    .from('realisations')
    .update({ status: 'validated' })
    .eq('id', id)
    .eq('enseignant_id', user.id)
    .select('resident_id')
    .single()
  if (error) return { error: error.message }

  const { error: historyError } = await supabase.from('validation_history').insert({
    realisation_id: id,
    enseignant_id: user.id,
    action: 'validated',
    feedback,
  })
  if (historyError) return { error: historyError.message }

  const { error: notificationError } = await supabase.from('notifications').insert({
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

  const { data: real, error } = await supabase
    .from('realisations')
    .update({ status: 'refused' })
    .eq('id', id)
    .eq('enseignant_id', user.id)
    .select('resident_id')
    .single()
  if (error) return { error: error.message }

  const { error: historyError } = await supabase.from('validation_history').insert({
    realisation_id: id,
    enseignant_id: user.id,
    action: 'refused',
    feedback,
  })
  if (historyError) return { error: historyError.message }

  const { error: notificationError } = await supabase.from('notifications').insert({
    user_id: real.resident_id,
    realisation_id: id,
    type: 'refused',
    is_read: false,
  })
  if (notificationError) return { error: notificationError.message }

  revalidatePath('/enseignant/demandes')
  return { success: true }
}
