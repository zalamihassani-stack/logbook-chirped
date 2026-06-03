'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import StatusTabs from '@/components/ui/StatusTabs'
import FilterPanel from '@/components/ui/FilterPanel'
import ExportTravauxButton from './ExportTravauxButton'
import { formatTravailAuthors, getStatusOptionsForType, TRAVAIL_STATUS_LABELS, TRAVAIL_STATUS_STYLES, TRAVAIL_VALIDATION_STYLES } from '@/lib/travaux'

const WORKFLOW_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'pending', label: 'À valider' },
  { id: 'validated', label: 'Validés' },
]

const MODE_TABS = [
  { id: 'own', label: 'Mes travaux' },
  { id: 'mentions', label: 'Mes mentions' },
]

const MENTION_FILTERS = [
  { id: 'first', label: '1er auteur' },
  { id: 'second', label: '2e auteur' },
  { id: 'other', label: 'Autres' },
  { id: 'last', label: 'Dernier' },
]

export default function TravauxClient({ initialTravaux, types, residentName, residentId, enseignants, initialType = 'all', initialValidation = 'all' }) {
  const travaux = initialTravaux
  const [mode, setMode] = useState('own')
  const [workflowFilter, setWorkflowFilter] = useState(() => normalizeWorkflowFilter(initialValidation))
  const [mentionFilter, setMentionFilter] = useState('first')
  const [typeFilter, setTypeFilter] = useState(() => types.some((type) => type.id === initialType) ? initialType : 'all')
  const [yearFilter, setYearFilter] = useState('all')
  const [encadrantFilter, setEncadrantFilter] = useState('all')

  const years = useMemo(() => Array.from(new Set(travaux.map((travail) => travail.year).filter(Boolean))).sort((a, b) => b - a), [travaux])
  const modeData = useMemo(() => {
    if (mode === 'mentions') return travaux.filter((travail) => isMentionedAuthor(travail, residentId) && travail.resident_id !== residentId)
    return travaux.filter((travail) => travail.resident_id === residentId)
  }, [mode, residentId, travaux])
  const primaryFilters = mode === 'mentions' ? MENTION_FILTERS : WORKFLOW_FILTERS
  const counts = useMemo(() => Object.fromEntries(primaryFilters.map((filter) => [
    filter.id,
    modeData.filter((travail) => mode === 'mentions'
      ? matchMentionPosition(travail, residentId, filter.id)
      : matchWorkflow(travail, filter.id)).length,
  ])), [mode, modeData, primaryFilters, residentId])
  const filtered = travaux.filter((travail) => {
    const matchesMode = mode === 'mentions'
      ? isMentionedAuthor(travail, residentId) && travail.resident_id !== residentId
      : travail.resident_id === residentId
    const matchesPrimary = mode === 'mentions'
      ? matchMentionPosition(travail, residentId, mentionFilter)
      : matchWorkflow(travail, workflowFilter)
    const matchesType = typeFilter === 'all' || travail.type_id === typeFilter
    const matchesYear = yearFilter === 'all' || String(travail.year) === yearFilter
    const matchesEncadrant = encadrantFilter === 'all' || travail.encadrant_id === encadrantFilter
    return matchesMode && matchesPrimary && matchesType && matchesYear && matchesEncadrant
  })
  const hasSecondaryFilters = typeFilter !== 'all' || yearFilter !== 'all' || encadrantFilter !== 'all'

  function switchMode(nextMode) {
    setMode(nextMode)
    setWorkflowFilter('all')
    setMentionFilter('first')
    setTypeFilter('all')
    setYearFilter('all')
    setEncadrantFilter('all')
  }

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

      <StatusTabs
        tabs={MODE_TABS.map((filter) => ({ value: filter.id, label: filter.label }))}
        activeValue={mode}
        onChange={switchMode}
        columns={2}
        className="mb-5"
      />

      <StatusTabs
        tabs={primaryFilters.map((filter) => ({ value: filter.id, label: filter.label }))}
        activeValue={mode === 'mentions' ? mentionFilter : workflowFilter}
        counts={counts}
        onChange={mode === 'mentions' ? setMentionFilter : setWorkflowFilter}
        columns={4}
        className="mb-5"
      />

      <FilterPanel active={hasSecondaryFilters} className="mb-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            <option value="all">Tous les types</option>
            {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>

          <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            <option value="all">Toutes les années</option>
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
                setTypeFilter('all')
                setYearFilter('all')
                setEncadrantFilter('all')
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 sm:col-span-2"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </FilterPanel>

      <div className="space-y-2">
        {filtered.map((travail) => (
          <TravailCard key={travail.id} travail={travail} residentId={residentId} showMention={mode === 'mentions'} />
        ))}
        {filtered.length === 0 && <p className="rounded-lg bg-white py-8 text-center text-sm text-slate-400">Aucun travail</p>}
      </div>

    </>
  )
}

function TravailCard({ travail, residentId, showMention }) {
  const validationStyle = TRAVAIL_VALIDATION_STYLES[travail.validation_status] ?? { bg: '#f1f5f9', color: '#64748b' }
  const statusStyle = TRAVAIL_STATUS_STYLES[travail.status] ?? { bg: '#f1f5f9', color: '#64748b' }
  const typeColor = travail.travail_types?.color_hex ?? 'var(--color-navy)'
  const roleLabel = getAuthorRoleLabel(travail, residentId)

  return (
    <Link href={`/resident/travaux/${travail.id}`}
      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-slate-200">
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
          {showMention && roleLabel && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {roleLabel}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold leading-snug text-slate-800">{travail.title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
          {travail.year} - {formatTravailAuthors(travail) || 'Auteurs non renseignés'}
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
  const authors = (travail.travail_auteurs ?? [])
    .slice()
    .sort((a, b) => (a.author_order ?? 0) - (b.author_order ?? 0))
  const index = authors.findIndex((author) => author.profile_id === residentId)
  return { index, count: authors.length }
}

function isMentionedAuthor(travail, residentId) {
  return getAuthorPosition(travail, residentId).index >= 0
}

function getAuthorRoleLabel(travail, residentId) {
  const { index, count } = getAuthorPosition(travail, residentId)
  if (index === 0) return '1er auteur'
  if (index === 1) return '2e auteur'
  if (count > 1 && index === count - 1) return 'Dernier auteur'
  if (index > 1) return 'Autre position'
  return ''
}

function matchMentionPosition(travail, residentId, filter) {
  const { index, count } = getAuthorPosition(travail, residentId)
  if (index < 0) return false
  if (filter === 'first') return index === 0
  if (filter === 'second') return index === 1
  if (filter === 'other') return index > 1 && index !== count - 1
  if (filter === 'last') return count > 1 && index === count - 1
  return true
}

function shortValidationLabel(status) {
  if (status === 'pending_initial') return 'À valider'
  if (status === 'pending_final') return 'Validation finale'
  if (status === 'initial_validated') return 'Validé initial'
  if (status === 'final_validated') return 'Validé'
  if (status === 'refused') return 'À corriger'
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
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Année</label>
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
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Journal / Congrès</label>
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
            <option value="">Non renseigné</option>
            {enseignants.map((enseignant) => <option key={enseignant.id} value={enseignant.id}>{enseignant.full_name}</option>)}
          </select>
        </div>
      </Fieldset>

      <Fieldset title="Auteurs">
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
    <section className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
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
