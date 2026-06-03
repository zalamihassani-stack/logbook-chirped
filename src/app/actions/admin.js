'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isMissingAppSettingsTable } from '@/lib/app-settings'
import { normalizeService } from '@/lib/logbook'
import { revalidatePath } from 'next/cache'

const VALID_ROLES = new Set(['admin', 'enseignant', 'resident'])
const SETTING_KEYS = ['push_notifications', 'validation_required', 'allow_hors_objectifs', 'compte_rendu_required']
const DEFAULT_CATEGORY_COLOR = '#0D2B4E'

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
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'admin' || profile?.is_active === false) {
    throw new Error('Acces administrateur requis.')
  }

  return { supabase, user, profile }
}

async function logAdminAction(action, targetType, targetId = null, details = {}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    await admin.from('admin_audit_logs').insert({
      admin_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    })
  } catch {
    // Audit logging should never block the admin workflow.
  }
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
      service: role === 'enseignant' ? normalizeService(data.service) : null,
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
      service: normalizeService(data?.service),
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

async function getNextProcedureCode(client) {
  const { data, error } = await client
    .from('procedures')
    .select('procedure_code')
    .not('procedure_code', 'is', null)
    .order('procedure_code', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (Number.parseInt(data?.procedure_code, 10) || 0) + 1
}

async function assertCategoryMatchesService(client, categoryId, service) {
  if (!categoryId) return { error: 'La categorie est obligatoire.' }
  const normalizedService = normalizeService(service)
  const { data: category, error } = await client
    .from('categories')
    .select('id, service')
    .eq('id', categoryId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!category) return { error: 'Categorie introuvable.' }
  if (normalizeService(category.service) !== normalizedService) {
    return { error: 'La categorie selectionnee ne correspond pas au service du geste.' }
  }

  return { success: true }
}

async function assertCategoryServiceCanChange(client, categoryId, service) {
  const normalizedService = normalizeService(service)
  const { data, error } = await client
    .from('procedures')
    .select('id, service')
    .eq('category_id', categoryId)
    .eq('is_active', true)

  if (error) return { error: error.message }
  const hasOtherServiceProcedures = (data ?? []).some((procedure) => normalizeService(procedure.service) !== normalizedService)
  if (hasOtherServiceProcedures) {
    return { error: 'Cette categorie contient des gestes actifs d un autre service.' }
  }

  return { success: true }
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

export async function createUser({ email, password, full_name, role, service, residanat_start_date, promotion }) {
  try {
    await requireAdmin()
  } catch (error) {
    return { error: error.message }
  }

  const normalized = normalizeUserPayload({ full_name, role, service, residanat_start_date, promotion })
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
  await logAdminAction('create_user', 'profile', user.id, { role: normalized.data.role, email: email.trim() })
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
  await logAdminAction('update_user', 'profile', id, { role: normalized.data.role })
  return { success: true }
}

export async function deactivateUser(id) {
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
  const { error: profileError } = await supabase.from('profiles').update({ is_active: false }).eq('id', id)
  if (profileError) return { error: profileError.message }

  await admin.auth.admin.updateUserById(id, { ban_duration: '876000h' })

  revalidatePath('/admin/utilisateurs')
  revalidatePath('/admin')
  await logAdminAction('deactivate_user', 'profile', id)
  return { success: true }
}

export async function reactivateUser(id) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const admin = createAdminClient()
  const { error } = await supabase.from('profiles').update({ is_active: true }).eq('id', id)
  if (error) return { error: error.message }

  await admin.auth.admin.updateUserById(id, { ban_duration: 'none' })

  revalidatePath('/admin/utilisateurs')
  revalidatePath('/admin')
  await logAdminAction('reactivate_user', 'profile', id)
  return { success: true }
}

export async function resetUserPassword(id, password) {
  if (!password || password.length < 8) return { error: 'Le mot de passe doit contenir au moins 8 caracteres.' }

  try {
    await requireAdmin()
  } catch (error) {
    return { error: error.message }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(id, { password })
  if (error) return { error: error.message }

  await logAdminAction('reset_user_password', 'profile', id)
  return { success: true }
}

export async function createCategory({ name, service, color_hex, display_order }) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const normalized = normalizeCategoryPayload({ name, service, color_hex, display_order })
  if (normalized.error) return { error: normalized.error }

  const { error } = await supabase.from('categories').insert(normalized.data)
  if (error) return { error: error.message }

  revalidatePath('/admin/gestes')
  await logAdminAction('create_category', 'category', null, { name: normalized.data.name })
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

  const serviceCheck = await assertCategoryServiceCanChange(supabase, id, normalized.data.service)
  if (serviceCheck.error) return { error: serviceCheck.error }

  const { error } = await supabase.from('categories').update(normalized.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/gestes')
  await logAdminAction('update_category', 'category', id, { name: normalized.data.name })
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
  await logAdminAction('delete_category', 'category', id)
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
  name,
  category_id,
  pathologie,
  service,
  objectif_final,
  target_level,
  target_count,
  target_year,
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
  const normalizedService = normalizeService(service)
  const categoryCheck = await assertCategoryMatchesService(supabase, category_id, normalizedService)
  if (categoryCheck.error) return { error: categoryCheck.error }

  const { data: proc, error } = await supabase
    .from('procedures')
    .insert({
      procedure_code: await getNextProcedureCode(supabase),
      name,
      category_id,
      pathologie,
      service: normalizedService,
      objectif_final,
      target_level,
      target_count,
      target_year,
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
  await logAdminAction('create_procedure', 'procedure', proc.id, { name })
  return { success: true }
}

export async function updateProcedure(id, payload) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }
  const normalizedService = normalizeService(payload.service)
  const categoryCheck = await assertCategoryMatchesService(supabase, payload.category_id, normalizedService)
  if (categoryCheck.error) return { error: categoryCheck.error }

  const { error } = await supabase
    .from('procedures')
    .update({
      name: payload.name,
      category_id: payload.category_id,
      pathologie: payload.pathologie,
      service: normalizedService,
      objectif_final: payload.objectif_final,
      target_level: payload.target_level,
      target_count: payload.target_count,
      target_year: payload.target_year,
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
  await logAdminAction('update_procedure', 'procedure', id, { name: payload.name })
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
  await logAdminAction('deactivate_procedure', 'procedure', id)
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
  await logAdminAction('save_settings', 'app_settings', '1', normalizedSettings)
  return { success: true }
}

export async function previewDeleteResidentData({ residentId }) {
  if (!residentId) return { error: 'Selectionnez un resident.' }

  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const { count, error } = await supabase
    .from('realisations')
    .select('id', { count: 'exact', head: true })
    .eq('resident_id', residentId)
  if (error) return { error: error.message }
  return { success: true, count: count ?? 0 }
}

export async function previewDeleteActesByPeriod({ from, to }) {
  if (!from || !to) return { error: 'Indiquez une date de debut et une date de fin.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return { error: 'Format de date invalide.' }
  if (from > to) return { error: 'La date de debut doit preceder la date de fin.' }

  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const exclusiveTo = nextDateInputValue(to)
  const { count, error } = await supabase
    .from('realisations')
    .select('id', { count: 'exact', head: true })
    .gte('performed_at', from)
    .lt('performed_at', exclusiveTo)
  if (error) return { error: error.message }
  return { success: true, count: count ?? 0 }
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
  await logAdminAction('delete_resident_realisations', 'profile', residentId, { deletedCount: count })
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
  await logAdminAction('delete_realisations_by_period', 'realisations', null, { from, to, deletedCount: count })
  return { success: true, deletedCount: count }
}

export async function importReferentiel({ categories = [], procedures = [] }) {
  let supabase
  try {
    ;({ supabase } = await requireAdmin())
  } catch (error) {
    return { error: error.message }
  }

  const normalizedCategories = categories
    .map((category, index) => ({
      name: category.name?.trim(),
      service: normalizeService(category.service),
      color_hex: /^#[0-9a-f]{6}$/i.test(category.color_hex ?? '') ? category.color_hex : DEFAULT_CATEGORY_COLOR,
      display_order: Number.parseInt(category.display_order, 10) || index,
    }))
    .filter((category) => category.name)

  for (const category of normalizedCategories) {
    const { data: existing, error: existingError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', category.name)
      .eq('service', category.service)
      .maybeSingle()
    if (existingError) return { error: existingError.message }

    const query = existing
      ? supabase.from('categories').update(category).eq('id', existing.id)
      : supabase.from('categories').insert(category)
    const { error } = await query
    if (error) return { error: error.message }
  }

  const { data: allCategories, error: catError } = await supabase.from('categories').select('id, name, service')
  if (catError) return { error: catError.message }
  const categoryByKey = new Map((allCategories ?? []).map((category) => [`${normalizeService(category.service)}::${category.name}`, category.id]))

  let importedProcedures = 0
  let nextProcedureCode = await getNextProcedureCode(supabase)
  for (const item of procedures) {
    const name = item.name?.trim()
    if (!name) continue
    const service = normalizeService(item.service)
    const categoryId = item.category_id || categoryByKey.get(`${service}::${item.category_name}`)
    if (!categoryId) {
      return { error: `Categorie introuvable pour "${name}" dans le service ${service}.` }
    }
    const payload = {
      name,
      category_id: categoryId,
      pathologie: item.pathologie?.trim() || null,
      service,
      objectif_final: Number.parseInt(item.target_level ?? item.objectif_final, 10) || 3,
      target_level: Number.parseInt(item.target_level ?? item.objectif_final, 10) || 3,
      target_count: Number.parseInt(item.target_count, 10) || 1,
      target_year: Number.parseInt(item.target_year, 10) || 1,
      seuil_exposition_min: 0,
      seuil_supervision_min: 0,
      seuil_autonomie_min: 0,
      seuil_deblocage_autonomie: 0,
      is_active: true,
    }
    if (payload.target_level === 1) payload.seuil_exposition_min = payload.target_count
    if (payload.target_level === 2) payload.seuil_supervision_min = payload.target_count
    if (payload.target_level === 3) payload.seuil_autonomie_min = payload.target_count

    const { data: existing, error: existingError } = await supabase
      .from('procedures')
      .select('id')
      .eq('name', name)
      .maybeSingle()
    if (existingError) return { error: existingError.message }

    const query = existing
      ? supabase.from('procedures').update(payload).eq('id', existing.id)
      : supabase.from('procedures').insert({ ...payload, procedure_code: nextProcedureCode++ })
    const { error } = await query
    if (error) return { error: error.message }
    importedProcedures += 1
  }

  revalidatePath('/admin/gestes')
  await logAdminAction('import_referentiel', 'referentiel', null, { categories: normalizedCategories.length, procedures: importedProcedures })
  return { success: true, categories: normalizedCategories.length, procedures: importedProcedures }
}
