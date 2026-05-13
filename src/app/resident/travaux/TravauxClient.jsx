'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import ExportTravauxButton from './ExportTravauxButton'
import { createTravail } from '@/app/actions/resident'
import { formatTravailAuthors, getStatusOptionsForType, getTravailValidationHelp, TRAVAIL_STATUS_LABELS, TRAVAIL_STATUS_STYLES, TRAVAIL_VALIDATION_LABELS, TRAVAIL_VALIDATION_STYLES } from '@/lib/travaux'

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

export default function TravauxClient({ initialTravaux, types, residentName, residentId, enseignants, residents }) {
  const [travaux] = useState(initialTravaux)
  const [tabType, setTabType] = useState('all')
  const [validationFilter, setValidationFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(() => initForm(types, residentId))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtered = travaux.filter((travail) => {
    const matchesType = tabType === 'all' || travail.type_id === tabType
    const matchesValidation =
      validationFilter === 'all'
      || (validationFilter === 'pending' && ['pending_initial', 'pending_final'].includes(travail.validation_status))
      || travail.validation_status === validationFilter
    return matchesType && matchesValidation
  })
  const people = useMemo(() => [...enseignants, ...residents], [enseignants, residents])

  function openCreate() {
    setForm(initForm(types, residentId))
    setError('')
    setModal(true)
  }

  function setField(key, value) {
    setForm((current) => {
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
    window.location.reload()
  }

  return (
    <>
      <PageHeader title="Travaux scientifiques" subtitle={`${travaux.length} travail(x)`} action={
        <div className="flex gap-2">
          <ExportTravauxButton residentName={residentName} />
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#0D2B4E' }}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
      } />

      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setTabType('all')}
          className="rounded-full px-4 py-1.5 text-sm font-medium transition"
          style={tabType === 'all' ? { backgroundColor: '#0D2B4E', color: 'white' } : { backgroundColor: 'white', color: '#0D2B4E', border: '1px solid #e2e8f0' }}>
          Tous
        </button>
        {types.map((type) => (
          <button key={type.id} onClick={() => setTabType(type.id)}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition"
            style={tabType === type.id
              ? { backgroundColor: type.color_hex, color: 'white' }
              : { backgroundColor: `${type.color_hex}20`, color: type.color_hex, border: `1px solid ${type.color_hex}40` }}>
            {type.name}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'Toutes validations' },
          { id: 'pending', label: 'À valider' },
          { id: 'refused', label: 'Corrections' },
          { id: 'initial_validated', label: 'Initiale faite' },
          { id: 'final_validated', label: 'Finale faite' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setValidationFilter(item.id)}
            className="rounded-full px-3 py-1.5 text-xs font-medium transition"
            style={validationFilter === item.id ? { backgroundColor: '#0D2B4E', color: 'white' } : { backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0' }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((travail) => {
          const statusStyle = TRAVAIL_STATUS_STYLES[travail.status] ?? { bg: '#f1f5f9', color: '#64748b' }
          const validationStyle = TRAVAIL_VALIDATION_STYLES[travail.validation_status] ?? { bg: '#f1f5f9', color: '#64748b' }
          const validationHelp = getTravailValidationHelp(travail.validation_status)
          return (
            <Link key={travail.id} href={`/resident/travaux/${travail.id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-slate-200">
              <div className="min-w-0 flex-1 pr-3">
                <p className="truncate text-sm font-semibold text-slate-800">{travail.title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {travail.year} · {formatTravailAuthors(travail) || 'Auteurs non renseignés'}
                </p>
              </div>
              <div className="mr-2 flex flex-shrink-0 flex-col items-end gap-1">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                  Statut : {TRAVAIL_STATUS_LABELS[travail.status] ?? travail.status}
                </span>
                <span title={validationHelp} className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: validationStyle.bg, color: validationStyle.color }}>
                  Validation : {TRAVAIL_VALIDATION_LABELS[travail.validation_status] ?? travail.validation_status}
                </span>
              </div>
              <ChevronRight size={16} className="flex-shrink-0 text-slate-400" />
            </Link>
          )
        })}
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucun travail enregistré</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#0D2B4E' }}>Ajouter un travail</h2>
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

function initForm(types, residentId = '') {
  const type = types[0]
  const status = getStatusOptionsForType(type)[0]?.value ?? ''
  return { ...EMPTY, type_id: type?.id ?? '', status, first_author_profile_id: residentId }
}

export function TravailFields({ form, setField, setType, types, enseignants, people, toggleAuthor, setExternalAuthor, addExternalAuthor, removeExternalAuthor }) {
  const selectedType = types.find((type) => type.id === form.type_id)
  const statusOptions = getStatusOptionsForType(selectedType)
  const primaryAuthorIds = new Set([form.first_author_profile_id, form.second_author_profile_id].filter(Boolean))
  const otherPeople = people.filter((person) => !primaryAuthorIds.has(person.id))

  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Titre *</label>
        <input type="text" value={form.title} onChange={(event) => setField('title', event.target.value)} required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Type *</label>
          <select value={form.type_id} onChange={(event) => setType(event.target.value)} required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Statut</label>
        <select value={form.status} onChange={(event) => setField('status', event.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Enseignant encadrant</label>
        <select value={form.encadrant_id} onChange={(event) => setField('encadrant_id', event.target.value)}
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
          <option value="">Non renseigné</option>
          {enseignants.map((enseignant) => <option key={enseignant.id} value={enseignant.id}>{enseignant.full_name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Journal / Congrès</label>
        <input type="text" value={form.journal_or_event} onChange={(event) => setField('journal_or_event', event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Année</label>
          <input type="number" value={form.year} onChange={(event) => setField('year', Number.parseInt(event.target.value, 10))}
            min="2000" max="2100"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>DOI / URL</label>
          <input type="text" value={form.doi_or_url} onChange={(event) => setField('doi_or_url', event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium" style={{ color: '#0D2B4E' }}>Première position</p>
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
        <p className="mb-2 text-sm font-medium" style={{ color: '#0D2B4E' }}>Deuxième position</p>
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
        <p className="mb-2 text-sm font-medium" style={{ color: '#0D2B4E' }}>Autres auteurs du service</p>
        <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
          {otherPeople.map((person) => (
            <label key={person.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
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
          <p className="text-sm font-medium" style={{ color: '#0D2B4E' }}>Autres auteurs d&apos;autres services</p>
          <button type="button" onClick={addExternalAuthor} className="text-xs font-medium" style={{ color: '#0D2B4E' }}>Ajouter</button>
        </div>
        <div className="space-y-2">
          {form.other_external_authors.map((name, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(event) => setExternalAuthor(index, event.target.value)}
                placeholder="Nom et prénom, service"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
              {form.other_external_authors.length > 1 && (
                <button type="button" onClick={() => removeExternalAuthor(index)} className="rounded-lg border border-slate-200 px-3 text-sm text-slate-500">Retirer</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function AuthorPositionFields({ profileValue, externalValue, profileKey, externalKey, people, setField }) {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-2">
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
