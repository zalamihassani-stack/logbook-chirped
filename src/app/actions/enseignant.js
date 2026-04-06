'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function validateRealisation(id, feedback) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: real, error: re } = await supabase
    .from('realisations').update({ status: 'validated' }).eq('id', id)
    .select('resident_id').single()
  if (re) return { error: re.message }

  await supabase.from('validation_history').insert({
    realisation_id: id, enseignant_id: user.id, action: 'validated', feedback,
  })
  await supabase.from('notifications').insert({
    user_id: real.resident_id, realisation_id: id, type: 'validated', is_read: false,
  })
  revalidatePath('/enseignant/demandes')
  return { success: true }
}

export async function refuseRealisation(id, feedback) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: real, error: re } = await supabase
    .from('realisations').update({ status: 'refused' }).eq('id', id)
    .select('resident_id').single()
  if (re) return { error: re.message }

  await supabase.from('validation_history').insert({
    realisation_id: id, enseignant_id: user.id, action: 'refused', feedback,
  })
  await supabase.from('notifications').insert({
    user_id: real.resident_id, realisation_id: id, type: 'refused', is_read: false,
  })
  revalidatePath('/enseignant/demandes')
  return { success: true }
}
