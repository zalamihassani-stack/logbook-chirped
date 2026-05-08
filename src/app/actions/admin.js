'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
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

  if (error || profile?.role !== 'admin') {
    throw new Error('Acces administrateur requis.')
  }

  return { supabase, user }
}

export async function createUser({ email, password, full_name, role, residanat_start_date, promotion }) {
  try {
    await requireAdmin()
  } catch (error) {
    return { error: error.message }
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) return { error: error.message }

  const user = data?.user
  if (!user) return { error: 'Utilisateur non cree.' }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: user.id,
    full_name,
    role,
    is_active: true,
    residanat_start_date: residanat_start_date || null,
    promotion: promotion || null,
  })
  if (profileError) return { error: profileError.message }

  revalidatePath('/admin/utilisateurs')
  return { success: true }
}

export async function updateUser(id, data) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase.from('profiles').update(data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/utilisateurs')
  return { success: true }
}

export async function deleteUser(id) {
  try {
    await requireAdmin()
  } catch (error) {
    return { error: error.message }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { error: error.message }

  revalidatePath('/admin/utilisateurs')
  return { success: true }
}

export async function createCategory({ name, color_hex, display_order }) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase.from('categories').insert({ name, color_hex, display_order })
  if (error) return { error: error.message }

  revalidatePath('/admin/gestes')
  return { success: true }
}

export async function updateCategory(id, data) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase.from('categories').update(data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/gestes')
  return { success: true }
}

export async function deleteCategory(id) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/gestes')
  return { success: true }
}

function normalizeObjectiveRows(procedureId, objectives) {
  return (objectives ?? [])
    .filter((objective) => Number.parseInt(objective.required_level, 10) === 3)
    .map((objective) => ({
      procedure_id: procedureId,
      year: objective.year,
      required_level: 3,
      min_count: Number.parseInt(objective.min_count, 10) || 1,
    }))
}

export async function createProcedure({
  procedure_code,
  name,
  category_id,
  pathologie,
  objectif_final,
  seuil_exposition_min,
  seuil_supervision_min,
  seuil_autonomie_min,
  seuil_deblocage_autonomie,
  objectives,
}) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { data: proc, error } = await supabase
    .from('procedures')
    .insert({
      procedure_code,
      name,
      category_id,
      pathologie,
      objectif_final,
      seuil_exposition_min,
      seuil_supervision_min,
      seuil_autonomie_min,
      seuil_deblocage_autonomie,
      is_active: true,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  const rows = normalizeObjectiveRows(proc.id, objectives)
  if (rows.length) {
    const { error: objectivesError } = await supabase.from('procedure_objectives').insert(rows)
    if (objectivesError) return { error: objectivesError.message }
  }

  revalidatePath('/admin/gestes')
  return { success: true }
}

export async function updateProcedure(id, payload) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase
    .from('procedures')
    .update({
      procedure_code: payload.procedure_code,
      name: payload.name,
      category_id: payload.category_id,
      pathologie: payload.pathologie,
      objectif_final: payload.objectif_final,
      seuil_exposition_min: payload.seuil_exposition_min,
      seuil_supervision_min: payload.seuil_supervision_min,
      seuil_autonomie_min: payload.seuil_autonomie_min,
      seuil_deblocage_autonomie: payload.seuil_deblocage_autonomie,
    })
    .eq('id', id)
  if (error) return { error: error.message }

  if (payload.objectives) {
    const { error: deleteError } = await supabase
      .from('procedure_objectives')
      .delete()
      .eq('procedure_id', id)
    if (deleteError) return { error: deleteError.message }

    const rows = normalizeObjectiveRows(id, payload.objectives)
    if (rows.length) {
      const { error: objectivesError } = await supabase.from('procedure_objectives').insert(rows)
      if (objectivesError) return { error: objectivesError.message }
    }
  }

  revalidatePath('/admin/gestes')
  return { success: true }
}

export async function deleteProcedure(id) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase.from('procedures').update({ is_active: false }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/gestes')
  return { success: true }
}

export async function saveSettings(settings) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase
    .from('app_settings')
    .upsert({ id: 1, ...settings }, { onConflict: 'id' })
  if (error) return { error: error.message }

  revalidatePath('/admin/reglages')
  return { success: true }
}

export async function deleteResidentData({ residentId, confirmationToken }) {
  if (!residentId) return { error: 'Sélectionnez un résident.' }
  if (confirmationToken !== 'SUPPRIMER') {
    return { error: 'Confirmation requise: saisissez SUPPRIMER.' }
  }

  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { count, error: countError } = await supabase
    .from('realisations')
    .select('id', { count: 'exact', head: true })
    .eq('resident_id', residentId)
  if (countError) return { error: countError.message }
  if (!count) return { error: 'Aucun acte à supprimer pour ce résident.' }

  const { error } = await supabase.from('realisations').delete().eq('resident_id', residentId)
  if (error) return { error: error.message }

  revalidatePath('/admin/donnees')
  return { success: true, deletedCount: count }
}

export async function deleteActesByPeriod({ from, to, confirmationToken }) {
  if (!from || !to) {
    return { error: 'Indiquez une date de début et une date de fin.' }
  }
  if (from > to) {
    return { error: 'La date de début doit précéder la date de fin.' }
  }
  if (confirmationToken !== 'SUPPRIMER') {
    return { error: 'Confirmation requise: saisissez SUPPRIMER.' }
  }

  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  let countQuery = supabase
    .from('realisations')
    .select('id', { count: 'exact', head: true })
    .gte('performed_at', from)
    .lte('performed_at', to)

  const { count, error: countError } = await countQuery
  if (countError) return { error: countError.message }
  if (!count) return { error: 'Aucun acte à supprimer sur cette période.' }

  const { error } = await supabase
    .from('realisations')
    .delete()
    .gte('performed_at', from)
    .lte('performed_at', to)
  if (error) return { error: error.message }

  revalidatePath('/admin/donnees')
  return { success: true, deletedCount: count }
}
