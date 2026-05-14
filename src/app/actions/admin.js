'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isMissingAppSettingsTable } from '@/lib/app-settings'
import { revalidatePath } from 'next/cache'

const VALID_ROLES = new Set(['admin', 'enseignant', 'resident'])
const SETTING_KEYS = ['push_notifications', 'validation_required', 'allow_hors_objectifs', 'compte_rendu_required']

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

  return { supabase, user, profile }
}

function normalizeUserPayload(data) {
  const role = data?.role
  if (!VALID_ROLES.has(role)) return { error: 'Role invalide.' }

  const fullName = data?.full_name?.trim()
  if (!fullName) return { error: 'Le nom complet est obligatoire.' }

  return {
    data: {
      full_name: fullName,
      role,
      residanat_start_date: role === 'resident' ? data.residanat_start_date || null : null,
      promotion: role === 'resident' ? data.promotion?.trim() || null : null,
    },
  }
}

function normalizeCategoryPayload(data) {
  const name = data?.name?.trim()
  if (!name) return { error: 'Le nom de categorie est obligatoire.' }

  const color = /^#[0-9a-f]{6}$/i.test(data?.color_hex ?? '') ? data.color_hex : '#0D2B4E'
  return {
    data: {
      name,
      color_hex: color,
      display_order: Number.parseInt(data?.display_order, 10) || 0,
    },
  }
}

function nextDateInputValue(dateInput) {
  const [year, month, day] = String(dateInput).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + 1))
  return date.toISOString().slice(0, 10)
}

async function getActiveAdminCount(client) {
  const { count, error } = await client
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
    .eq('is_active', true)

  if (error) throw new Error(error.message)
  return count ?? 0
}

async function assertAdminCanChangeUser(client, { targetId, currentUserId, nextRole, deleting = false }) {
  const { data: target, error } = await client
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', targetId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!target) throw new Error('Utilisateur introuvable.')

  if (targetId === currentUserId && (deleting || nextRole !== 'admin')) {
    throw new Error('Vous ne pouvez pas retirer votre propre acces administrateur depuis cette page.')
  }

  if (target.role === 'admin' && target.is_active !== false && (deleting || nextRole !== 'admin')) {
    const activeAdminCount = await getActiveAdminCount(client)
    if (activeAdminCount <= 1) {
      throw new Error('Impossible de retirer le dernier administrateur actif.')
    }
  }

  return target
}

export async function createUser({ email, password, full_name, role, residanat_start_date, promotion }) {
  try {
    await requireAdmin()
  } catch (error) {
    return { error: error.message }
  }

  const normalized = normalizeUserPayload({ full_name, role, residanat_start_date, promotion })
  if (normalized.error) return { error: normalized.error }
  if (!email?.trim()) return { error: "L'email est obligatoire." }
  if (!password || password.length < 6) return { error: 'Le mot de passe doit contenir au moins 6 caracteres.' }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  })
  if (error) return { error: error.message }

  const user = data?.user
  if (!user) return { error: 'Utilisateur non cree.' }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: user.id,
    ...normalized.data,
    is_active: true,
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(user.id)
    return { error: profileError.message }
  }

  revalidatePath('/admin/utilisateurs')
  revalidatePath('/admin')
  return { success: true }
}

export async function updateUser(id, data) {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const normalized = normalizeUserPayload(data)
  if (normalized.error) return { error: normalized.error }

  try {
    await assertAdminCanChangeUser(supabase, { targetId: id, currentUserId: user.id, nextRole: normalized.data.role })
  } catch (error) {
    return { error: error.message }
  }

  const { error } = await supabase.from('profiles').update(normalized.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/utilisateurs')
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteUser(id) {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  try {
    await assertAdminCanChangeUser(supabase, { targetId: id, currentUserId: user.id, nextRole: null, deleting: true })
  } catch (error) {
    return { error: error.message }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { error: error.message }

  revalidatePath('/admin/utilisateurs')
  revalidatePath('/admin')
  return { success: true }
}

export async function createCategory({ name, color_hex, display_order }) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const normalized = normalizeCategoryPayload({ name, color_hex, display_order })
  if (normalized.error) return { error: normalized.error }

  const { error } = await supabase.from('categories').insert(normalized.data)
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

  const normalized = normalizeCategoryPayload(data)
  if (normalized.error) return { error: normalized.error }

  const { error } = await supabase.from('categories').update(normalized.data).eq('id', id)
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
    .map((objective) => ({
      procedure_id: procedureId,
      year: Number.parseInt(objective.year, 10),
      required_level: Number.parseInt(objective.required_level, 10),
      min_count: Number.parseInt(objective.min_count, 10) || 1,
    }))
    .filter((objective) =>
      objective.year >= 1 &&
      objective.year <= 5 &&
      objective.required_level >= 2 &&
      objective.required_level <= 3
    )
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

  const normalizedSettings = Object.fromEntries(
    SETTING_KEYS.map((key) => [key, Boolean(settings?.[key])])
  )

  const { error } = await supabase
    .from('app_settings')
    .upsert({ id: 1, ...normalizedSettings }, { onConflict: 'id' })
  if (error) {
    if (isMissingAppSettingsTable(error)) {
      return { error: 'Table app_settings absente. Executez le script supabase/app_settings.sql dans Supabase, puis rechargez cette page.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/reglages')
  revalidatePath('/resident/nouveau')
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return { error: 'Format de date invalide.' }
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

  const exclusiveTo = nextDateInputValue(to)

  let countQuery = supabase
    .from('realisations')
    .select('id', { count: 'exact', head: true })
    .gte('performed_at', from)
    .lt('performed_at', exclusiveTo)

  const { count, error: countError } = await countQuery
  if (countError) return { error: countError.message }
  if (!count) return { error: 'Aucun acte à supprimer sur cette période.' }

  const { error } = await supabase
    .from('realisations')
    .delete()
    .gte('performed_at', from)
    .lt('performed_at', exclusiveTo)
  if (error) return { error: error.message }

  revalidatePath('/admin/donnees')
  return { success: true, deletedCount: count }
}
