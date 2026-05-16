'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus, SlidersHorizontal } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import ExportTravauxButton from './ExportTravauxButton'
import { formatTravailAuthors, getStatusOptionsForType, TRAVAIL_STATUS_LABELS, TRAVAIL_STATUS_STYLES, TRAVAIL_VALIDATION_STYLES } from '@/lib/travaux'

const WORKFLOW_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'pending', label: 'A valider' },
  { id: 'validated', label: 'Valides' },
]

export default function TravauxClient({ initialTravaux, types, residentName, residentId, enseignants, initialType = 'all', initialValidation = 'all' }) {
  const travaux = initialTravaux
  const [workflowFilter, setWorkflowFilter] = useState(() => normalizeWorkflowFilter(initialValidation))
  const [typeFilter, setTypeFilter] = useState(() => types.some((type) => type.id === initialType) ? initialType : 'all')
  const [yearFilter, setYearFilter] = useState('all')
  const [encadrantFilter, setEncadrantFilter] = useState('all')
  const [authorFilter, setAuthorFilter] = useState('all')

  const years = useMemo(() => Array.from(new Set(travaux.map((travail) => travail.year).filter(Boolean))).sort((a, b) => b - a), [travaux])
  const counts = useMemo(() => Object.fromEntries(WORKFLOW_FILTERS.map((filter) => [
    filter.id,
    travaux.filter((travail) => matchWorkflow(travail, filter.id)).length,
  ])), [travaux])
  const filtered = travaux.filter((travail) => {
    const matchesWorkflow = matchWorkflow(travail, workflowFilter)
    const matchesType = typeFilter === 'all' || travail.type_id === typeFilter
    const matchesYear = yearFilter === 'all' || String(travail.year) === yearFilter
    const matchesEncadrant = encadrantFilter === 'all' || travail.encadrant_id === encadrantFilter
    const matchesAuthor = matchAuthorRole(travail, residentId, authorFilter)
    return matchesWorkflow && matchesType && matchesYear && matchesEncadrant && matchesAuthor
  })
  const hasSecondaryFilters = typeFilter !== 'all' || yearFilter !== 'all' || encadrantFilter !== 'all' || authorFilter !== 'all'

  return (
    <>
      <PageHeader title="Travaux scientifiques" subtitle={`${filtered.length} / ${travaux.length} ${travaux.length > 1 ? 'travaux' : 'travail'}`} action={
        <div className="flex flex-shrink-0 gap-2">
          <ExportTravauxButton residentName={residentName} />
          <Link href="/resident/travaux/nouveau"
            className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-white sm:px-4"
            style={{ backgroundColor: 'var(--color-navy)' }}>
            <Plus size={16} /> Ajouter
          </Link>
        </div>
      } />

      <div className="mb-5 grid grid-cols-4 gap-1 rounded-2xl bg-slate-100 p-1">
        {WORKFLOW_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setWorkflowFilter(filter.id)}
            className="rounded-xl px-1.5 py-2 text-center text-[11px] font-semibold transition sm:px-3 sm:text-sm"
            style={workflowFilter === filter.id ? { backgroundColor: 'var(--color-navy)', color: 'white' } : { color: '#64748b' }}
          >
            <span className="block truncate">{filter.label}</span>
            <span className="text-xs opacity-75">{counts[filter.id] ?? 0}</span>
          </button>
        ))}
      </div>

      <details className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm" open={hasSecondaryFilters}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={16} strokeWidth={1.8} />
            Filtres
          </span>
          {hasSecondaryFilters && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">actifs</span>}
        </summary>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select value={authorFilter} onChange={(event) => setAuthorFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            <option value="all">Tous mes travaux</option>
            <option value="owner">Crees par moi</option>
            <option value="first">1er auteur</option>
            <option value="second">2e auteur</option>
            <option value="other">Co-auteur</option>
          </select>

          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            <option value="all">Tous les types</option>
            {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>

          <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            <option value="all">Toutes les annees</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>

          <select value={encadrantFilter} onChange={(event) => setEncadrantFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            <option value="all">Tous les encadrants</option>
            {enseignants.map((enseignant) => <option key={enseignant.id} value={enseignant.id}>{enseignant.full_name}</option>)}
          </select>

          {hasSecondaryFilters && (
            <button
              type="button"
              onClick={() => {
                setAuthorFilter('all')
                setTypeFilter('all')
                setYearFilter('all')
                setEncadrantFilter('all')
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 sm:col-span-2"
            >
              Reinitialiser
            </button>
          )}
        </div>
      </details>

      <div className="space-y-2">
        {filtered.map((travail) => (
          <TravailCard key={travail.id} travail={travail} residentId={residentId} />
        ))}
        {filtered.length === 0 && <p className="rounded-2xl bg-white py-8 text-center text-sm text-slate-400">Aucun travail</p>}
      </div>

    </>
  )
}

function TravailCard({ travail, residentId }) {
  const validationStyle = TRAVAIL_VALIDATION_STYLES[travail.validation_status] ?? { bg: '#f1f5f9', color: '#64748b' }
  const statusStyle = TRAVAIL_STATUS_STYLES[travail.status] ?? { bg: '#f1f5f9', color: '#64748b' }
  const typeColor = travail.travail_types?.color_hex ?? 'var(--color-navy)'
  const roleLabel = getAuthorRoleLabel(travail, residentId)

  return (
    <Link href={`/resident/travaux/${travail.id}`}
      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-slate-200">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: `${typeColor}20`, color: typeColor }}>
            {travail.travail_types?.name ?? 'Travail'}
          </span>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: validationStyle.bg, color: validationStyle.color }}>
            {shortValidationLabel(travail.validation_status)}
          </span>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
            {TRAVAIL_STATUS_LABELS[travail.status] ?? travail.status}
          </span>
          {roleLabel && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {roleLabel}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold leading-snug text-slate-800">{travail.title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
          {travail.year} - {formatTravailAuthors(travail) || 'Auteurs non renseignes'}
        </p>
        {travail.encadrant?.full_name && <p className="mt-1 text-[11px] text-slate-400">{travail.encadrant.full_name}</p>}
      </div>
      <ChevronRight size={16} className="flex-shrink-0 text-slate-400" />
    </Link>
  )
}

function normalizeWorkflowFilter(value) {
  if (value === 'pending') return 'pending'
  if (value === 'validated' || value === 'initial_validated' || value === 'final_validated') return 'validated'
  if (value === 'in_progress') return 'in_progress'
  return 'all'
}

function matchWorkflow(travail, filter) {
  if (filter === 'pending') return ['pending_initial', 'pending_final'].includes(travail.validation_status)
  if (filter === 'validated') return ['initial_validated', 'final_validated'].includes(travail.validation_status)
  if (filter === 'in_progress') return travail.status === 'en_cours'
  return true
}

function getAuthorPosition(travail, residentId) {
  const index = (travail.travail_auteurs ?? [])
    .slice()
    .sort((a, b) => (a.author_order ?? 0) - (b.author_order ?? 0))
    .findIndex((author) => author.profile_id === residentId)
  return index >= 0 ? index + 1 : 0
}

function getAuthorRoleLabel(travail, residentId) {
  const position = getAuthorPosition(travail, residentId)
  if (position === 1) return '1er auteur'
  if (position === 2) return '2e auteur'
  if (position > 2) return 'Co-auteur'
  if (travail.resident_id === residentId) return 'Cree par moi'
  return ''
}

function matchAuthorRole(travail, residentId, filter) {
  const position = getAuthorPosition(travail, residentId)
  if (filter === 'owner') return travail.resident_id === residentId
  if (filter === 'first') return position === 1
  if (filter === 'second') return position === 2
  if (filter === 'other') return position > 2
  return travail.resident_id === residentId || position > 0
}

function shortValidationLabel(status) {
  if (status === 'pending_initial') return 'A valider'
  if (status === 'pending_final') return 'Validation finale'
  if (status === 'initial_validated') return 'Valide initial'
  if (status === 'final_validated') return 'Valide'
  if (status === 'refused') return 'A corriger'
  return status ?? '-'
}

export function TravailFields({ form, setField, setType, types, enseignants, people, toggleAuthor, setExternalAuthor, addExternalAuthor, removeExternalAuthor }) {
  const selectedType = types.find((type) => type.id === form.type_id)
  const statusOptions = getStatusOptionsForType(selectedType)
  const primaryAuthorIds = new Set([form.first_author_profile_id, form.second_author_profile_id].filter(Boolean))
  const otherPeople = people.filter((person) => !primaryAuthorIds.has(person.id))

  return (
    <>
      <Fieldset title="Travail">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Titre *</label>
          <input type="text" value={form.title} onChange={(event) => setField('title', event.target.value)} required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Type *</label>
            <select value={form.type_id} onChange={(event) => setType(event.target.value)} required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Statut</label>
            <select value={form.status} onChange={(event) => setField('status', event.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Annee</label>
            <input type="number" value={form.year} onChange={(event) => setField('year', Number.parseInt(event.target.value, 10))}
              min="2000" max="2100"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>DOI / URL</label>
            <input type="text" value={form.doi_or_url} onChange={(event) => setField('doi_or_url', event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Journal / Congres</label>
          <input type="text" value={form.journal_or_event} onChange={(event) => setField('journal_or_event', event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
        </div>
      </Fieldset>

      <Fieldset title="Encadrement">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Enseignant encadrant</label>
          <select value={form.encadrant_id} onChange={(event) => setField('encadrant_id', event.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            <option value="">Non renseigne</option>
            {enseignants.map((enseignant) => <option key={enseignant.id} value={enseignant.id}>{enseignant.full_name}</option>)}
          </select>
        </div>
      </Fieldset>

      <Fieldset title="Auteurs">
        <div>
          <p className="mb-2 text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Premiere position</p>
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
          <p className="mb-2 text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Deuxieme position</p>
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
          <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
            {otherPeople.map((person) => (
              <label key={person.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.other_profile_author_ids.includes(person.id)}
                  onChange={() => toggleAuthor(person.id)}
                />
                <span className="flex-1">{person.full_name}</span>
                <span className="text-xs text-slate-400">{person.role === 'enseignant' ? 'Enseignant' : 'Resident'}</span>
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
                  placeholder="Nom et prenom, service"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
                {form.other_external_authors.length > 1 && (
                  <button type="button" onClick={() => removeExternalAuthor(index)} className="rounded-lg border border-slate-200 px-3 text-sm text-slate-500">Retirer</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Fieldset>
    </>
  )
}

function Fieldset({ title, children }) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>{title}</p>
      {children}
    </section>
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
          <option value="">Non renseigne</option>
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
          placeholder="Nom et prenom, service"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
      </div>
    </div>
  )
}
