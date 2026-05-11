'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResidentYear } from '@/lib/utils'
import { sendPushToUser } from '@/lib/push'
import { isFinalWorkStatus } from '@/lib/travaux'
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
    throw new Error('Accès résident requis.')
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
  const admin = createAdminClient()

  const residentYear = getResidentYear(profile?.residanat_start_date)
  const [{ data: procedure }, { data: residentProfile }] = await Promise.all([
    supabase.from('procedures').select('name').eq('id', formData.procedure_id).maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ])

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

  const { error: historyError } = await admin.from('validation_history').insert({
    realisation_id: realisation.id,
    enseignant_id: formData.enseignant_id,
    action: 'submitted',
  })
  if (historyError) return { error: historyError.message }

  const { error: notificationError } = await admin.from('notifications').insert({
    user_id: formData.enseignant_id,
    realisation_id: realisation.id,
    type: 'new_submission',
    is_read: false,
  })
  if (notificationError) {
    console.error('Notification enseignant non créée', notificationError)
  }

  await sendPushToUser(formData.enseignant_id, {
    title: 'Nouvelle demande de validation',
    body: `${residentProfile?.full_name ?? 'Un résident'} a soumis ${procedure?.name ?? 'un geste'}.`,
    url: `/enseignant/demandes/${realisation.id}`,
    tag: `realisation-${realisation.id}`,
  })

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
  const admin = createAdminClient()

  const residentYear = getResidentYear(profile?.residanat_start_date)
  const [{ data: procedure }, { data: residentProfile }] = await Promise.all([
    supabase.from('procedures').select('name').eq('id', formData.procedure_id).maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ])

  const { data: objective } = await supabase
    .from('procedure_objectives')
    .select('id')
    .eq('procedure_id', formData.procedure_id)
    .eq('year', residentYear)
    .maybeSingle()

  const { data: updatedRealisation, error } = await supabase
    .from('realisations')
    .update({
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
    .eq('id', id)
    .eq('resident_id', user.id)
    .in('status', ['pending', 'refused'])
    .select('id')
    .maybeSingle()
  if (error) return { error: error.message }
  if (!updatedRealisation) return { error: 'Ce geste ne peut plus être modifié.' }

  const { error: historyError } = await admin.from('validation_history').insert({
    realisation_id: id,
    enseignant_id: formData.enseignant_id,
    action: 'resubmitted',
  })
  if (historyError) return { error: historyError.message }

  const { error: notificationError } = await admin.from('notifications').insert({
    user_id: formData.enseignant_id,
    realisation_id: id,
    type: 'new_submission',
    is_read: false,
  })
  if (notificationError) {
    console.error('Notification enseignant non créée', notificationError)
  }

  await sendPushToUser(formData.enseignant_id, {
    title: 'Demande renvoyée',
    body: `${residentProfile?.full_name ?? 'Un résident'} a renvoyé ${procedure?.name ?? 'un geste'} pour validation.`,
    url: `/enseignant/demandes/${id}`,
    tag: `realisation-${id}`,
  })

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
  const admin = createAdminClient()
  const { profile_author_ids: profileAuthorIds, external_authors: externalAuthors, ...travailData } = data
  const authorsText = await buildAuthorsText(admin, profileAuthorIds, externalAuthors, travailData.authors)
  const typeId = await resolveTravailTypeId(admin, travailData.type_id)
  if (!typeId) return { error: "Type de travail introuvable. Exécutez le script SQL des travaux scientifiques puis réessayez." }

  const { data: travail, error } = await supabase
    .from('travaux_scientifiques')
    .insert({
      ...travailData,
      type_id: typeId,
      authors: authorsText,
      resident_id: user.id,
      encadrant_id: travailData.encadrant_id || null,
      validation_status: 'pending_initial',
      validation_feedback: null,
    })
    .select('id')
    .single()
  if (error) return { error: formatTravailSchemaError(error) }

  const authorsError = await replaceTravailAuthors(admin, travail.id, profileAuthorIds, externalAuthors)
  if (authorsError) return { error: formatTravailSchemaError(authorsError) }

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
  const admin = createAdminClient()
  const { profile_author_ids: profileAuthorIds, external_authors: externalAuthors, ...travailData } = data
  const authorsText = await buildAuthorsText(admin, profileAuthorIds, externalAuthors, travailData.authors)
  const typeId = await resolveTravailTypeId(admin, travailData.type_id)
  if (!typeId) return { error: "Type de travail introuvable. Exécutez le script SQL des travaux scientifiques puis réessayez." }
  const { data: currentTravail } = await supabase
    .from('travaux_scientifiques')
    .select('validation_status, initial_validated_by')
    .eq('id', id)
    .eq('resident_id', user.id)
    .maybeSingle()
  const validationStatus = nextTravailValidationStatus(currentTravail, travailData.status)

  const { error } = await supabase
    .from('travaux_scientifiques')
    .update({
      ...travailData,
      type_id: typeId,
      authors: authorsText,
      encadrant_id: travailData.encadrant_id || null,
      validation_status: validationStatus,
      validation_feedback: null,
    })
    .eq('id', id)
    .eq('resident_id', user.id)
  if (error) return { error: formatTravailSchemaError(error) }

  const authorsError = await replaceTravailAuthors(admin, id, profileAuthorIds, externalAuthors)
  if (authorsError) return { error: formatTravailSchemaError(authorsError) }

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

async function buildAuthorsText(admin, profileAuthorIds = [], externalAuthors = [], fallback = '') {
  const external = Array.isArray(externalAuthors) ? externalAuthors : []
  const ids = (profileAuthorIds ?? []).filter(Boolean)
  const hasStructuredAuthors = ids.length > 0 || external.some((name) => name?.trim())
  if (!hasStructuredAuthors) return fallback || null

  let internalNames = []
  if (ids.length > 0) {
    const { data } = await admin.from('profiles').select('id, full_name').in('id', ids)
    const nameById = new Map((data ?? []).map((profile) => [profile.id, profile.full_name]))
    internalNames = ids.map((id) => nameById.get(id)).filter(Boolean)
  }

  const externalNames = external.map((name) => name.trim()).filter(Boolean)
  return [...internalNames, ...externalNames].join(', ') || null
}

async function replaceTravailAuthors(admin, travailId, profileAuthorIds = [], externalAuthors = []) {
  const { error: deleteError } = await admin.from('travail_auteurs').delete().eq('travail_id', travailId)
  if (deleteError) return deleteError

  const profileRows = (profileAuthorIds ?? [])
    .filter(Boolean)
    .map((profileId, index) => ({
      travail_id: travailId,
      profile_id: profileId,
      external_name: null,
      author_order: index,
    }))

  const externalRows = (externalAuthors ?? [])
    .map((name) => name?.trim())
    .filter(Boolean)
    .map((name, index) => ({
      travail_id: travailId,
      profile_id: null,
      external_name: name,
      author_order: profileRows.length + index,
    }))

  const rows = [...profileRows, ...externalRows]
  if (rows.length === 0) return null

  const { error } = await admin.from('travail_auteurs').insert(rows)
  return error
}

function formatTravailSchemaError(error) {
  const message = error?.message ?? ''
  if (message.includes('encadrant_id') || message.includes('validation_status') || message.includes('travail_auteurs') || message.includes('schema cache')) {
    return "La structure Supabase des travaux scientifiques n'est pas encore à jour. Exécutez le script supabase/travaux_scientifiques_enhancements.sql dans Supabase, puis rechargez le schéma."
  }
  return message
}

function nextTravailValidationStatus(currentTravail, nextScientificStatus) {
  const wasInitiallyValidated = Boolean(currentTravail?.initial_validated_by) || ['initial_validated', 'pending_final', 'final_validated'].includes(currentTravail?.validation_status)
  if (isFinalWorkStatus(nextScientificStatus)) {
    return wasInitiallyValidated ? 'pending_final' : 'pending_initial'
  }
  return wasInitiallyValidated ? 'initial_validated' : 'pending_initial'
}

async function resolveTravailTypeId(admin, typeIdOrKey) {
  if (!typeIdOrKey) return null
  if (isUuid(typeIdOrKey)) return typeIdOrKey

  const keyToNames = {
    article: ['article'],
    communication_orale: ['communication orale'],
    communication_affichee: ['communication affichée', 'communication affichee'],
  }
  const acceptedNames = keyToNames[typeIdOrKey] ?? [String(typeIdOrKey).replaceAll('_', ' ')]
  const { data } = await admin
    .from('travail_types')
    .select('id, name')
    .eq('is_active', true)

  const match = (data ?? []).find((type) => {
    const normalized = normalizeLookup(type.name)
    return acceptedNames.some((name) => normalizeLookup(name) === normalized)
  })

  return match?.id ?? null
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value))
}

function normalizeLookup(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
