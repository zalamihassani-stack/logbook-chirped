'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Pencil, Trash2, X } from 'lucide-react'
import { updateTravail, deleteTravail, submitTravailFinalValidation } from '@/app/actions/resident'
import { getStatusOptionsForType, getTravailTypeKey } from '@/lib/travaux'
import { TravailFields } from '../TravauxClient'

export default function TravauxDetailActions({ travail, types, enseignants, residents }) {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [finalModal, setFinalModal] = useState(false)
  const [form, setForm] = useState(() => initForm(travail, types))
  const [finalForm, setFinalForm] = useState(() => initFinalForm(travail))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const people = useMemo(() => [...enseignants, ...residents], [enseignants, residents])
  const typeKey = getTravailTypeKey(travail.travail_types)
  const hasInitialValidation = Boolean(travail.initial_validated_by || travail.initial_validated_at)
  const canSubmitFinal = travail.validation_status === 'initial_validated'
    || (travail.validation_status === 'refused' && hasInitialValidation)
  const finalStatusLabel = typeKey === 'article' ? 'Publié' : 'Présenté'

  function setField(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if ((key === 'first_author_profile_id' || key === 'second_author_profile_id') && value) {
        next.other_profile_author_ids = current.other_profile_author_ids.filter((profileId) => profileId !== value)
      }
      return next
    })
  }

  function setFinalField(key, value) {
    setFinalForm((current) => {
      const next = { ...current, [key]: value }
      if ((key === 'first_author_profile_id' || key === 'second_author_profile_id') && value) {
        next.other_profile_author_ids = current.other_profile_author_ids.filter((profileId) => profileId !== value)
      }
      return next
    })
  }

  function setType(typeId) {
    const type = types.find((item) => item.id === typeId)
    const options = getStatusOptionsForType(type)
    setForm((current) => ({
      ...current,
      type_id: typeId,
      status: options.some((option) => option.value === current.status) ? current.status : options[0]?.value ?? '',
    }))
  }

  function toggleAuthor(profileId) {
    setForm((current) => {
      const selected = new Set(current.other_profile_author_ids)
      if (selected.has(profileId)) selected.delete(profileId)
      else selected.add(profileId)
      return { ...current, other_profile_author_ids: Array.from(selected) }
    })
  }

  function setExternalAuthor(index, value) {
    setForm((current) => ({
      ...current,
      other_external_authors: current.other_external_authors.map((name, itemIndex) => itemIndex === index ? value : name),
    }))
  }

  function addExternalAuthor() {
    setForm((current) => ({ ...current, other_external_authors: [...current.other_external_authors, ''] }))
  }

  function removeExternalAuthor(index) {
    setForm((current) => ({
      ...current,
      other_external_authors: current.other_external_authors.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function toggleFinalAuthor(profileId) {
    setFinalForm((current) => {
      const selected = new Set(current.other_profile_author_ids)
      if (selected.has(profileId)) selected.delete(profileId)
      else selected.add(profileId)
      return { ...current, other_profile_author_ids: Array.from(selected) }
    })
  }

  function setFinalExternalAuthor(index, value) {
    setFinalForm((current) => ({
      ...current,
      other_external_authors: current.other_external_authors.map((name, itemIndex) => itemIndex === index ? value : name),
    }))
  }

  function addFinalExternalAuthor() {
    setFinalForm((current) => ({ ...current, other_external_authors: [...current.other_external_authors, ''] }))
  }

  function removeFinalExternalAuthor(index) {
    setFinalForm((current) => ({
      ...current,
      other_external_authors: current.other_external_authors.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const res = await updateTravail(travail.id, form)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setModal(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce travail ?')) return
    setLoading(true)
    await deleteTravail(travail.id)
    router.push('/resident/travaux')
  }

  async function handleFinalSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const res = await submitTravailFinalValidation(travail.id, finalForm)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setFinalModal(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          style={{ color: 'var(--color-navy)' }}
        >
          <Pencil size={15} strokeWidth={1.75} />
          Modifier
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
        >
          <Trash2 size={15} strokeWidth={1.75} />
          Supprimer
        </button>
        {canSubmitFinal && (
          <button
            onClick={() => {
              setFinalForm(initFinalForm(travail))
              setError('')
              setFinalModal(true)
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <CheckCircle size={15} strokeWidth={1.75} />
            Soumettre pour validation finale
          </button>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-navy)' }}>Modifier</h2>
              <button onClick={() => setModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <TravailFields
                form={form}
                setField={setField}
                setType={setType}
                types={types}
                enseignants={enseignants}
                people={people}
                toggleAuthor={toggleAuthor}
                setExternalAuthor={setExternalAuthor}
                addExternalAuthor={addExternalAuthor}
                removeExternalAuthor={removeExternalAuthor}
              />
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-navy)' }}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {finalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-navy)' }}>Soumission finale</h2>
                <p className="mt-1 text-xs text-slate-500">Le statut passera à : {finalStatusLabel}</p>
              </div>
              <button onClick={() => setFinalModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Titre confirmé *</label>
                <input
                  type="text"
                  required
                  value={finalForm.title}
                  onChange={(event) => setFinalField('title', event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>
                  {typeKey === 'article' ? 'Journal' : 'Congrès'}
                </label>
                <input
                  type="text"
                  value={finalForm.journal_or_event}
                  onChange={(event) => setFinalField('journal_or_event', event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </div>
              <FinalAuthorsFields
                form={finalForm}
                people={people}
                setField={setFinalField}
                toggleAuthor={toggleFinalAuthor}
                setExternalAuthor={setFinalExternalAuthor}
                addExternalAuthor={addFinalExternalAuthor}
                removeExternalAuthor={removeFinalExternalAuthor}
              />
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>
                  {typeKey === 'article' ? 'DOI / URL *' : 'DOI / URL'}
                </label>
                <input
                  type="text"
                  required={typeKey === 'article'}
                  value={finalForm.doi_or_url}
                  onChange={(event) => setFinalField('doi_or_url', event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? 'Soumission...' : 'Soumettre à l’encadrant'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function initForm(travail, types) {
  const selectedType = types.find((type) => type.id === travail.type_id) ?? types[0]
  const options = getStatusOptionsForType(selectedType)
  const structuredAuthors = travail.travail_auteurs ?? []
    .slice()
    .sort((a, b) => (a.author_order ?? 0) - (b.author_order ?? 0))
  const firstAuthor = structuredAuthors[0]
  const secondAuthor = structuredAuthors[1]
  const otherAuthors = structuredAuthors.slice(2)
  const otherExternalAuthors = otherAuthors.filter((author) => !author.profile_id && author.external_name).map((author) => author.external_name)

  return {
    title: travail.title,
    type_id: travail.type_id ?? selectedType?.id ?? '',
    journal_or_event: travail.journal_or_event ?? '',
    year: travail.year,
    encadrant_id: travail.encadrant_id ?? '',
    first_author_profile_id: firstAuthor?.profile_id ?? '',
    first_external_author: firstAuthor?.profile_id ? '' : firstAuthor?.external_name ?? '',
    second_author_profile_id: secondAuthor?.profile_id ?? '',
    second_external_author: secondAuthor?.profile_id ? '' : secondAuthor?.external_name ?? '',
    other_profile_author_ids: otherAuthors.filter((author) => author.profile_id).map((author) => author.profile_id),
    other_external_authors: otherExternalAuthors.length > 0 ? otherExternalAuthors : [''],
    doi_or_url: travail.doi_or_url ?? '',
    status: options.some((option) => option.value === travail.status) ? travail.status : options[0]?.value ?? '',
  }
}

function initFinalForm(travail) {
  return {
    ...initForm(travail, [{ id: travail.type_id, ...(travail.travail_types ?? {}) }]),
    journal_or_event: travail.journal_or_event ?? '',
    doi_or_url: travail.doi_or_url ?? '',
  }
}

function FinalAuthorsFields({ form, people, setField, toggleAuthor, setExternalAuthor, addExternalAuthor, removeExternalAuthor }) {
  const primaryAuthorIds = new Set([form.first_author_profile_id, form.second_author_profile_id].filter(Boolean))
  const otherPeople = people.filter((person) => !primaryAuthorIds.has(person.id))

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Auteurs confirmés</p>
      <div>
        <p className="mb-2 text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Première position</p>
        <AuthorPositionFields
          profileValue={form.first_author_profile_id}
          externalValue={form.first_external_author}
          profileKey="first_author_profile_id"
          externalKey="first_external_author"
          people={people}
          setField={setField}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Deuxième position</p>
        <AuthorPositionFields
          profileValue={form.second_author_profile_id}
          externalValue={form.second_external_author}
          profileKey="second_author_profile_id"
          externalKey="second_external_author"
          people={people}
          setField={setField}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Autres auteurs du service</p>
        <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-white p-2">
          {otherPeople.map((person) => (
            <label key={person.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.other_profile_author_ids.includes(person.id)}
                onChange={() => toggleAuthor(person.id)}
              />
              <span className="flex-1">{person.full_name}</span>
              <span className="text-xs text-slate-400">{person.role === 'enseignant' ? 'Enseignant' : 'Résident'}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Autres auteurs d&apos;autres services</p>
          <button type="button" onClick={addExternalAuthor} className="text-xs font-medium" style={{ color: 'var(--color-navy)' }}>Ajouter</button>
        </div>
        <div className="space-y-2">
          {form.other_external_authors.map((name, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(event) => setExternalAuthor(index, event.target.value)}
                placeholder="Nom et prénom, service"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
              {form.other_external_authors.length > 1 && (
                <button type="button" onClick={() => removeExternalAuthor(index)} className="rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500">Retirer</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AuthorPositionFields({ profileValue, externalValue, profileKey, externalKey, people, setField }) {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-100 bg-white p-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Auteur du service</label>
        <select
          value={profileValue}
          onChange={(event) => {
            setField(profileKey, event.target.value)
            if (event.target.value) setField(externalKey, '')
          }}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">Non renseigné</option>
          {people.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Ou auteur d&apos;un autre service</label>
        <input
          type="text"
          value={externalValue}
          onChange={(event) => {
            setField(externalKey, event.target.value)
            if (event.target.value) setField(profileKey, '')
          }}
          placeholder="Nom et prénom, service"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
      </div>
    </div>
  )
}
