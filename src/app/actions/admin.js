'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Utilisateurs ───────────────────────────────────────────
export async function createUser({ email, password, full_name, role, residanat_start_date, promotion }) {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (error) return { error: error.message }

  const user = data?.user
  if (!user) return { error: 'Utilisateur non créé.' }

  const { error: pe } = await admin.from('profiles').upsert({
    id: user.id,
    full_name, role, is_active: true,
    residanat_start_date: residanat_start_date || null,
    promotion: promotion || null,
  })
  if (pe) return { error: pe.message }

  revalidatePath('/admin/utilisateurs')
  return { success: true }
}

export async function updateUser(id, data) {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/utilisateurs')
  return { success: true }
}

export async function deleteUser(id) {
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { error: error.message }
  revalidatePath('/admin/utilisateurs')
  return { success: true }
}

// ─── Catégories ──────────────────────────────────────────────
export async function createCategory({ name, color_hex, display_order }) {
  const supabase = await createClient()
  const { error } = await supabase.from('categories').insert({ name, color_hex, display_order })
  if (error) return { error: error.message }
  revalidatePath('/admin/gestes')
  return { success: true }
}

export async function updateCategory(id, data) {
  const supabase = await createClient()
  const { error } = await supabase.from('categories').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/gestes')
  return { success: true }
}

export async function deleteCategory(id) {
  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/gestes')
  return { success: true }
}

// ─── Procédures ───────────────────────────────────────────────
export async function createProcedure({ procedure_code, name, category_id, pathologie, objectives }) {
  const supabase = await createClient()
  const { data: proc, error } = await supabase
    .from('procedures')
    .insert({ procedure_code, name, category_id, pathologie, is_active: true })
    .select('id').single()
  if (error) return { error: error.message }

  if (objectives?.length) {
    const rows = objectives
      .filter(o => o.required_level)
      .map(o => ({ procedure_id: proc.id, year: o.year, required_level: o.required_level, min_count: o.min_count || 1 }))
    if (rows.length) await supabase.from('procedure_objectives').insert(rows)
  }
  revalidatePath('/admin/gestes')
  return { success: true }
}

export async function updateProcedure(id, { procedure_code, name, category_id, pathologie, objectives }) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('procedures')
    .update({ procedure_code, name, category_id, pathologie })
    .eq('id', id)
  if (error) return { error: error.message }

  if (objectives) {
    await supabase.from('procedure_objectives').delete().eq('procedure_id', id)
    const rows = objectives
      .filter(o => o.required_level)
      .map(o => ({ procedure_id: id, year: o.year, required_level: o.required_level, min_count: o.min_count || 1 }))
    if (rows.length) await supabase.from('procedure_objectives').insert(rows)
  }
  revalidatePath('/admin/gestes')
  return { success: true }
}

export async function deleteProcedure(id) {
  const supabase = await createClient()
  const { error } = await supabase.from('procedures').update({ is_active: false }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/gestes')
  return { success: true }
}

// ─── Réglages ────────────────────────────────────────────────
export async function saveSettings(settings) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('app_settings')
    .upsert({ id: 1, ...settings }, { onConflict: 'id' })
  if (error) return { error: error.message }
  revalidatePath('/admin/reglages')
  return { success: true }
}

// ─── Suppressions données ─────────────────────────────────────
export async function deleteResidentData(residentId) {
  const supabase = await createClient()
  await supabase.from('realisations').delete().eq('resident_id', residentId)
  revalidatePath('/admin/donnees')
  return { success: true }
}

export async function deleteActesByPeriod({ from, to }) {
  const supabase = await createClient()
  let q = supabase.from('realisations').delete()
  if (from) q = q.gte('performed_at', from)
  if (to) q = q.lte('performed_at', to)
  const { error } = await q
  if (error) return { error: error.message }
  revalidatePath('/admin/donnees')
  return { success: true }
}
