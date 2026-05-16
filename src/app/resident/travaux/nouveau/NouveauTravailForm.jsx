'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { createTravail } from '@/app/actions/resident'
import { getStatusOptionsForType } from '@/lib/travaux'
import { TravailFields } from '../TravauxClient'

const EMPTY = {
  title: '',
  type_id: '',
  journal_or_event: '',
  year: new Date().getFullYear(),
  encadrant_id: '',
  first_author_profile_id: '',
  first_external_author: '',
  second_author_profile_id: '',
  second_external_author: '',
  other_profile_author_ids: [],
  other_external_authors: [''],
  doi_or_url: '',
  status: '',
}

function initForm(types, residentId = '') {
  const type = types[0]
  const status = getStatusOptionsForType(type)[0]?.value ?? ''
  return { ...EMPTY, type_id: type?.id ?? '', status, first_author_profile_id: residentId }
}

export default function NouveauTravailForm({ types, enseignants, residents, residentId }) {
  const router = useRouter()
  const [form, setFormState] = useState(() => initForm(types, residentId))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const people = useMemo(() => [...enseignants, ...residents], [enseignants, residents])

  function setField(key, value) {
    setFormState((current) => {
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
    setFormState((current) => ({
      ...current,
      type_id: typeId,
      status: options.some((option) => option.value === current.status) ? current.status : options[0]?.value ?? '',
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
    const res = await createTravail(form)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    router.push('/resident/travaux')
  }

  return (
    <>
      <PageHeader title="Nouveau travail" subtitle="Travail scientifique, auteurs, encadrant." />

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
            href="/resident/travaux"
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
