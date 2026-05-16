'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { updateTravail } from '@/app/actions/resident'
import { getStatusOptionsForType } from '@/lib/travaux'
import { TravailFields } from '../../TravauxClient'

function initForm(travail, types) {
  const selectedType = types.find((type) => type.id === travail.type_id) ?? types[0]
  const options = getStatusOptionsForType(selectedType)
  const structuredAuthors = (travail.travail_auteurs ?? [])
    .slice()
    .sort((a, b) => (a.author_order ?? 0) - (b.author_order ?? 0))
  const firstAuthor = structuredAuthors[0]
  const secondAuthor = structuredAuthors[1]
  const otherAuthors = structuredAuthors.slice(2)
  const otherExternalAuthors = otherAuthors
    .filter((a) => !a.profile_id && a.external_name)
    .map((a) => a.external_name)

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
    other_profile_author_ids: otherAuthors.filter((a) => a.profile_id).map((a) => a.profile_id),
    other_external_authors: otherExternalAuthors.length > 0 ? otherExternalAuthors : [''],
    doi_or_url: travail.doi_or_url ?? '',
    status: options.some((o) => o.value === travail.status) ? travail.status : options[0]?.value ?? '',
  }
}

export default function ModifierTravailForm({ travail, types, enseignants, residents }) {
  const router = useRouter()
  const [form, setFormState] = useState(() => initForm(travail, types))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const people = useMemo(() => [...enseignants, ...residents], [enseignants, residents])

  function setField(key, value) {
    setFormState((current) => {
      const next = { ...current, [key]: value }
      if ((key === 'first_author_profile_id' || key === 'second_author_profile_id') && value) {
        next.other_profile_author_ids = current.other_profile_author_ids.filter((id) => id !== value)
      }
      return next
    })
  }

  function setType(typeId) {
    const type = types.find((item) => item.id === typeId)
    const options = getStatusOptionsForType(type)
    setFormState((current) => ({
      ...current,
      type_id: typeId,
      status: options.some((o) => o.value === current.status) ? current.status : options[0]?.value ?? '',
    }))
  }

  function toggleAuthor(profileId) {
    setFormState((current) => {
      const selected = new Set(current.other_profile_author_ids)
      if (selected.has(profileId)) selected.delete(profileId)
      else selected.add(profileId)
      return { ...current, other_profile_author_ids: Array.from(selected) }
    })
  }

  function setExternalAuthor(index, value) {
    setFormState((current) => ({
      ...current,
      other_external_authors: current.other_external_authors.map((name, i) => i === index ? value : name),
    }))
  }

  function addExternalAuthor() {
    setFormState((current) => ({ ...current, other_external_authors: [...current.other_external_authors, ''] }))
  }

  function removeExternalAuthor(index) {
    setFormState((current) => ({
      ...current,
      other_external_authors: current.other_external_authors.filter((_, i) => i !== index),
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
    router.push(`/resident/travaux/${travail.id}`)
  }

  return (
    <>
      <PageHeader title="Modifier le travail" subtitle={travail.title} />

      <form onSubmit={handleSubmit} className="space-y-4 pb-28 md:pb-0">
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

        {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

        <div className="sticky bottom-20 z-20 flex gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <Link
            href={`/resident/travaux/${travail.id}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-navy)' }}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </>
  )
}
