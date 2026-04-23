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

export async function createProcedure({ procedure_code, name, category_id, pathologie, objectives }) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { data: proc, error } = await supabase
    .from('procedures')
    .insert({ procedure_code, name, category_id, pathologie, is_active: true })
    .select('id')
    .single()
  if (error) return { error: error.message }

  if (objectives?.length) {
    const rows = objectives
      .filter((objective) => objective.required_level)
      .map((objective) => ({
        procedure_id: proc.id,
        year: objective.year,
        required_level: objective.required_level,
        min_count: 1,
      }))

    if (rows.length) {
      const { error: objectivesError } = await supabase.from('procedure_objectives').insert(rows)
      if (objectivesError) return { error: objectivesError.message }
    }
  }

  revalidatePath('/admin/gestes')
  return { success: true }
}

export async function updateProcedure(id, { procedure_code, name, category_id, pathologie, objectives }) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase
    .from('procedures')
    .update({ procedure_code, name, category_id, pathologie })
    .eq('id', id)
  if (error) return { error: error.message }

  if (objectives) {
    const { error: deleteError } = await supabase
      .from('procedure_objectives')
      .delete()
      .eq('procedure_id', id)
    if (deleteError) return { error: deleteError.message }

    const rows = objectives
      .filter((objective) => objective.required_level)
      .map((objective) => ({
        procedure_id: id,
        year: objective.year,
        required_level: objective.required_level,
        min_count: 1,
      }))

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

export async function deleteResidentData(residentId) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase.from('realisations').delete().eq('resident_id', residentId)
  if (error) return { error: error.message }

  revalidatePath('/admin/donnees')
  return { success: true }
}

export async function deleteActesByPeriod({ from, to }) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  let query = supabase.from('realisations').delete()
  if (from) query = query.gte('performed_at', from)
  if (to) query = query.lte('performed_at', to)

  const { error } = await query
  if (error) return { error: error.message }

  revalidatePath('/admin/donnees')
  return { success: true }
}
