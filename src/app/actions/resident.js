'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResidentYear } from '@/lib/utils'
import { normalizeObjectifLevel } from '@/lib/logbook'
import { sendPushToUser } from '@/lib/push'
import { getTravailTypeKey, isFinalWorkStatus } from '@/lib/travaux'
import { getAppSettings } from '@/lib/app-settings'
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

  const validationError = validateRealisationPayload(formData)
  if (validationError) return { error: validationError }

  const residentYear = getResidentYear(profile?.residanat_start_date)
  const [{ data: procedure }, { data: residentProfile }] = await Promise.all([
    supabase.from('procedures').select('name, target_level, target_year').eq('id', formData.procedure_id).maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ])

  const [settingsRes] = await Promise.all([
    getAppSettings(supabase, 'allow_hors_objectifs, compte_rendu_required'),
  ])
  const isObjective = isProcedureObjectiveForYear(procedure, residentYear)
  const settingsError = validateRealisationSettings(formData, settingsRes.settings, isObjective)
  if (settingsError) return { error: settingsError }

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
      is_hors_objectifs: !isObjective,
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

  const validationError = validateRealisationPayload(formData)
  if (validationError) return { error: validationError }

  const residentYear = getResidentYear(profile?.residanat_start_date)
  const [{ data: procedure }, { data: residentProfile }] = await Promise.all([
    supabase.from('procedures').select('name, target_level, target_year').eq('id', formData.procedure_id).maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ])

  const [settingsRes] = await Promise.all([
    getAppSettings(supabase, 'allow_hors_objectifs, compte_rendu_required'),
  ])
  const isObjective = isProcedureObjectiveForYear(procedure, residentYear)
  const settingsError = validateRealisationSettings(formData, settingsRes.settings, isObjective)
  if (settingsError) return { error: settingsError }

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
      is_hors_objectifs: !isObjective,
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
  const { authorInput, ...travailData } = normalizeTravailAuthorInput(data)
  const requiredError = validateTravailRequiredFields(travailData)
  if (requiredError) return { error: requiredError }
  const authorsText = await buildAuthorsText(admin, authorInput.orderedAuthors, travailData.authors)
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

  const authorsError = await replaceTravailAuthors(admin, travail.id, authorInput.orderedAuthors)
  if (authorsError) return { error: formatTravailSchemaError(authorsError) }

  await notifyEncadrantForTravail(admin, {
    travailId: travail.id,
    encadrantId: travailData.encadrant_id,
    residentId: user.id,
    title: travailData.title,
    validationStatus: 'pending_initial',
  })

  revalidatePath('/resident')
  revalidatePath('/resident/travaux')
  revalidatePath('/enseignant/travaux')
  revalidatePath('/enseignant')
  revalidatePath('/enseignant/profil')
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
  const { authorInput, ...travailData } = normalizeTravailAuthorInput(data)
  const requiredError = validateTravailRequiredFields(travailData)
  if (requiredError) return { error: requiredError }
  const authorsText = await buildAuthorsText(admin, authorInput.orderedAuthors, travailData.authors)
  const typeId = await resolveTravailTypeId(admin, travailData.type_id)
  if (!typeId) return { error: "Type de travail introuvable. Exécutez le script SQL des travaux scientifiques puis réessayez." }
  const { data: currentTravail } = await supabase
    .from('travaux_scientifiques')
    .select('validation_status, initial_validated_by, encadrant_id')
    .eq('id', id)
    .eq('resident_id', user.id)
    .maybeSingle()
  const validationStatus = nextTravailValidationStatus(currentTravail, travailData.status)
  const shouldNotifyEncadrant = ['pending_initial', 'pending_final'].includes(validationStatus)
    && (currentTravail?.validation_status !== validationStatus || currentTravail?.encadrant_id !== travailData.encadrant_id)

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

  const authorsError = await replaceTravailAuthors(admin, id, authorInput.orderedAuthors)
  if (authorsError) return { error: formatTravailSchemaError(authorsError) }

  if (shouldNotifyEncadrant) {
    await notifyEncadrantForTravail(admin, {
      travailId: id,
      encadrantId: travailData.encadrant_id,
      residentId: user.id,
      title: travailData.title,
      validationStatus,
    })
  }

  revalidatePath('/resident')
  revalidatePath('/resident/travaux')
  revalidatePath(`/resident/travaux/${id}`)
  revalidatePath('/enseignant/travaux')
  revalidatePath('/enseignant')
  revalidatePath('/enseignant/profil')
  return { success: true }
}

export async function submitTravailFinalValidation(id, data) {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireResident())
  } catch (error) {
    return { error: error.message }
  }
  const admin = createAdminClient()

  const { data: currentTravail, error: readError } = await supabase
    .from('travaux_scientifiques')
    .select('id, title, authors, resident_id, validation_status, initial_validated_by, initial_validated_at, encadrant_id, type_id, travail_types(name)')
    .eq('id', id)
    .eq('resident_id', user.id)
    .maybeSingle()
  if (readError) return { error: formatTravailSchemaError(readError) }
  if (!currentTravail) return { error: 'Travail introuvable.' }
  const hasInitialValidation = Boolean(currentTravail.initial_validated_by || currentTravail.initial_validated_at)
  const canSubmitFinal = currentTravail.validation_status === 'initial_validated'
    || (currentTravail.validation_status === 'refused' && hasInitialValidation)
  if (!canSubmitFinal) {
    return { error: 'Ce travail doit être validé initialement avant la soumission finale.' }
  }
  if (!currentTravail.encadrant_id) {
    return { error: 'Un encadrant est obligatoire pour soumettre en validation finale.' }
  }

  const typeKey = getTravailTypeKey(currentTravail.travail_types)
  const finalStatus = typeKey === 'article' ? 'publie' : 'presente'
  const { authorInput, ...travailData } = normalizeTravailAuthorInput(data ?? {})
  const title = travailData.title?.trim()
  if (!title) {
    return { error: 'Le titre est obligatoire pour la soumission finale.' }
  }
  const doiOrUrl = data?.doi_or_url?.trim() ?? ''
  if (typeKey === 'article' && !doiOrUrl) {
    return { error: 'Le DOI / URL est obligatoire pour soumettre un article en validation finale.' }
  }
  const authorsText = await buildAuthorsText(admin, authorInput.orderedAuthors, currentTravail.authors)

  const { error } = await supabase
    .from('travaux_scientifiques')
    .update({
      title,
      authors: authorsText,
      status: finalStatus,
      journal_or_event: travailData.journal_or_event?.trim() || null,
      doi_or_url: doiOrUrl || null,
      validation_status: 'pending_final',
      validation_feedback: null,
    })
    .eq('id', id)
    .eq('resident_id', user.id)
  if (error) return { error: formatTravailSchemaError(error) }

  const authorsError = await replaceTravailAuthors(admin, id, authorInput.orderedAuthors)
  if (authorsError) return { error: formatTravailSchemaError(authorsError) }

  await notifyEncadrantForTravail(admin, {
    travailId: id,
    encadrantId: currentTravail.encadrant_id,
    residentId: user.id,
    title,
    validationStatus: 'pending_final',
  })

  revalidatePath('/resident')
  revalidatePath('/resident/travaux')
  revalidatePath(`/resident/travaux/${id}`)
  revalidatePath('/enseignant')
  revalidatePath('/enseignant/profil')
  revalidatePath('/enseignant/travaux')
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

  revalidatePath('/resident')
  revalidatePath('/resident/travaux')
  revalidatePath('/enseignant')
  revalidatePath('/enseignant/profil')
  revalidatePath('/enseignant/travaux')
  return { success: true }
}

function validateRealisationPayload(formData) {
  if (!formData?.procedure_id) return 'Sélectionnez un geste.'
  if (!formData?.enseignant_id) return 'Sélectionnez un enseignant.'
  if (!formData?.activity_type) return "Sélectionnez un type d'activité."
  if (!['expose', 'supervise', 'autonome'].includes(formData.activity_type)) {
    return "Type d'activité invalide."
  }
  if (!formData?.performed_at) return 'Indiquez la date de réalisation.'

  const performedAt = new Date(`${formData.performed_at}T00:00:00`)
  const tomorrow = new Date()
  tomorrow.setHours(24, 0, 0, 0)
  if (Number.isNaN(performedAt.getTime()) || performedAt >= tomorrow) {
    return 'La date de réalisation ne peut pas être dans le futur.'
  }

  const ipp = formData.ipp_patient?.trim()
  if (ipp && ipp.length > 64) return 'IPP patient trop long.'

  return ''
}

function validateRealisationSettings(formData, settings, objective) {
  if (settings?.allow_hors_objectifs === false && !objective) {
    return 'Les gestes hors objectifs sont desactives par un administrateur.'
  }

  if (settings?.compte_rendu_required && !formData?.compte_rendu?.trim()) {
    return 'Le compte rendu operatoire est obligatoire.'
  }

  return ''
}

function isProcedureObjectiveForYear(procedure, residentYear) {
  if (!procedure) return false
  const targetLevel = normalizeObjectifLevel(procedure.target_level)
  const targetYear = Number.parseInt(procedure.target_year, 10)
  if (targetLevel === 1) return true
  if (!targetYear) return false
  return residentYear >= targetYear
}

async function buildAuthorsText(admin, orderedAuthors = [], fallback = '') {
  const authors = (orderedAuthors ?? []).filter((author) => author.profileId || author.externalName)
  const ids = authors.map((author) => author.profileId).filter(Boolean)
  const hasStructuredAuthors = authors.length > 0
  if (!hasStructuredAuthors) return fallback || null

  let nameById = new Map()
  if (ids.length > 0) {
    const { data } = await admin.from('profiles').select('id, full_name').in('id', ids)
    nameById = new Map((data ?? []).map((profile) => [profile.id, profile.full_name]))
  }

  return authors
    .map((author) => author.profileId ? nameById.get(author.profileId) : author.externalName)
    .filter(Boolean)
    .join(', ') || null
}

function normalizeTravailAuthorInput(data) {
  const {
    first_author_profile_id: firstProfileId,
    first_external_author: firstExternalAuthor,
    second_author_profile_id: secondProfileId,
    second_external_author: secondExternalAuthor,
    other_profile_author_ids: otherProfileAuthorIds,
    other_external_authors: otherExternalAuthors,
    profile_author_ids: legacyProfileAuthorIds,
    external_authors: legacyExternalAuthors,
    ...travailData
  } = data

  const firstAuthor = normalizeAuthorSlot(firstProfileId, firstExternalAuthor)
  const secondAuthor = normalizeAuthorSlot(secondProfileId, secondExternalAuthor)
  const primaryProfileIds = new Set([firstAuthor?.profileId, secondAuthor?.profileId].filter(Boolean))
  const primaryExternalNames = new Set([firstAuthor?.externalName, secondAuthor?.externalName].filter(Boolean).map(normalizeLookup))
  const otherProfileIds = (otherProfileAuthorIds ?? legacyProfileAuthorIds ?? [])
    .filter(Boolean)
    .filter((profileId) => !primaryProfileIds.has(profileId))
  const otherExternalNames = (otherExternalAuthors ?? legacyExternalAuthors ?? [])
    .map((name) => name?.trim())
    .filter(Boolean)
    .filter((name) => !primaryExternalNames.has(normalizeLookup(name)))

  const orderedAuthors = dedupeAuthors([
    firstAuthor,
    secondAuthor,
    ...otherProfileIds.map((profileId) => ({ profileId, externalName: null })),
    ...otherExternalNames.map((name) => normalizeAuthorSlot('', name)),
  ])

  return { authorInput: { orderedAuthors }, ...travailData }
}

function dedupeAuthors(authors = []) {
  const seenProfiles = new Set()
  const seenExternalNames = new Set()

  return authors.filter((author) => {
    if (!author) return false
    if (author.profileId) {
      if (seenProfiles.has(author.profileId)) return false
      seenProfiles.add(author.profileId)
      return true
    }
    const externalKey = normalizeLookup(author.externalName)
    if (!externalKey || seenExternalNames.has(externalKey)) return false
    seenExternalNames.add(externalKey)
    return true
  })
}

function normalizeAuthorSlot(profileId, externalName) {
  if (profileId) return { profileId, externalName: null }
  const name = externalName?.trim()
  return name ? { profileId: null, externalName: name } : null
}

async function replaceTravailAuthors(admin, travailId, orderedAuthors = []) {
  const { error: deleteError } = await admin.from('travail_auteurs').delete().eq('travail_id', travailId)
  if (deleteError) return deleteError

  const rows = (orderedAuthors ?? [])
    .filter((author) => author.profileId || author.externalName)
    .map((author, index) => ({
      travail_id: travailId,
      profile_id: author.profileId,
      external_name: author.externalName,
      author_order: index,
    }))
  if (rows.length === 0) return null

  const { error } = await admin.from('travail_auteurs').insert(rows)
  return error
}

function formatTravailSchemaError(error) {
  const message = error?.message ?? ''
  if (message.includes('travail_status')) {
    return "La liste des statuts Supabase n'est pas encore à jour. Relancez le script supabase/travaux_scientifiques_enhancements.sql dans Supabase, puis réessayez."
  }
  if (message.includes('encadrant_id') || message.includes('validation_status') || message.includes('travail_auteurs') || message.includes('schema cache')) {
    return "La structure Supabase des travaux scientifiques n'est pas encore à jour. Exécutez le script supabase/travaux_scientifiques_enhancements.sql dans Supabase, puis rechargez le schéma."
  }
  return message
}

function validateTravailRequiredFields(travailData) {
  if (!travailData.status) return 'Le statut est obligatoire.'
  if (!travailData.encadrant_id) return "L'encadrant est obligatoire."
  return ''
}

function nextTravailValidationStatus(currentTravail, nextScientificStatus) {
  const wasInitiallyValidated = Boolean(currentTravail?.initial_validated_by) || ['initial_validated', 'pending_final', 'final_validated'].includes(currentTravail?.validation_status)
  if (isFinalWorkStatus(nextScientificStatus)) {
    return wasInitiallyValidated ? 'pending_final' : 'pending_initial'
  }
  return wasInitiallyValidated ? 'initial_validated' : 'pending_initial'
}

async function notifyEncadrantForTravail(admin, { travailId, encadrantId, residentId, title, validationStatus }) {
  if (!encadrantId) return

  const { data: residentProfile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', residentId)
    .maybeSingle()

  const isFinal = validationStatus === 'pending_final'
  const notificationType = isFinal ? 'travail_pending_final' : 'travail_pending_initial'
  const pushTitle = isFinal ? 'Travail à valider définitivement' : 'Nouveau travail à valider'
  const pushBody = `${residentProfile?.full_name ?? 'Un résident'} a soumis "${title ?? 'un travail scientifique'}".`

  const { error: notificationError } = await admin.from('notifications').insert({
    user_id: encadrantId,
    travail_id: travailId,
    type: notificationType,
    is_read: false,
  })
  if (notificationError) {
    console.error('Notification enseignant non créée pour le travail', notificationError)
  }

  await sendPushToUser(encadrantId, {
    title: pushTitle,
    body: pushBody,
    url: `/enseignant/travaux?validation=${validationStatus}`,
    tag: `travail-${travailId}-${validationStatus}`,
  })
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
