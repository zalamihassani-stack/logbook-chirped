'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, X } from 'lucide-react'
import { updateTravail, deleteTravail } from '@/app/actions/resident'
import { getStatusOptionsForType } from '@/lib/travaux'
import { TravailFields } from '../TravauxClient'

export default function TravauxDetailActions({ travail, types, enseignants, residents }) {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(() => initForm(travail, types))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const people = useMemo(() => [...enseignants, ...residents], [enseignants, residents])

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
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
      const selected = new Set(current.profile_author_ids)
      if (selected.has(profileId)) selected.delete(profileId)
      else selected.add(profileId)
      return { ...current, profile_author_ids: Array.from(selected) }
    })
  }

  function setExternalAuthor(index, value) {
    setForm((current) => ({
      ...current,
      external_authors: current.external_authors.map((name, itemIndex) => itemIndex === index ? value : name),
    }))
  }

  function addExternalAuthor() {
    setForm((current) => ({ ...current, external_authors: [...current.external_authors, ''] }))
  }

  function removeExternalAuthor(index) {
    setForm((current) => ({
      ...current,
      external_authors: current.external_authors.filter((_, itemIndex) => itemIndex !== index),
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

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          style={{ color: '#0D2B4E' }}
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
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#0D2B4E' }}>Modifier</h2>
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
                style={{ backgroundColor: '#0D2B4E' }}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
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
  const externalAuthors = structuredAuthors
    .filter((author) => !author.profile_id && author.external_name)
    .sort((a, b) => (a.author_order ?? 0) - (b.author_order ?? 0))
    .map((author) => author.external_name)

  return {
    title: travail.title,
    type_id: travail.type_id ?? selectedType?.id ?? '',
    journal_or_event: travail.journal_or_event ?? '',
    year: travail.year,
    encadrant_id: travail.encadrant_id ?? '',
    profile_author_ids: structuredAuthors.filter((author) => author.profile_id).map((author) => author.profile_id),
    external_authors: externalAuthors.length > 0 ? externalAuthors : [''],
    doi_or_url: travail.doi_or_url ?? '',
    status: options.some((option) => option.value === travail.status) ? travail.status : options[0]?.value ?? '',
  }
}
