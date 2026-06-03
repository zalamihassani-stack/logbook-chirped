'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, FileDown, Loader2 } from 'lucide-react'
import { SkeletonList } from '@/components/ui/SkeletonCard'
import AppCard from '@/components/ui/AppCard'
import FilterPanel from '@/components/ui/FilterPanel'
import StatusTabs from '@/components/ui/StatusTabs'
import {
  formatTravailAuthors,
  TRAVAIL_STATUS_LABELS,
  TRAVAIL_STATUS_STYLES,
  TRAVAIL_VALIDATION_LABELS,
  TRAVAIL_VALIDATION_STYLES,
} from '@/lib/travaux'

const MODE_TABS = [
  { id: 'encadrement', label: 'Encadrement' },
  { id: 'mentions', label: 'Mes mentions' },
]

const ENCADREMENT_TABS = [
  { id: 'pending', label: 'À valider' },
  { id: 'validated', label: 'Validés' },
  { id: 'refused', label: 'Refusés' },
  { id: 'all', label: 'Tous' },
]

const MENTION_TABS = [
  { id: 'first', label: '1er auteur' },
  { id: 'second', label: '2e auteur' },
  { id: 'other', label: 'Autres' },
  { id: 'last', label: 'Dernier' },
]

function fmtToday() {
  return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function TravauxTab({ travailTypes, currentEnseignantId = '' }) {
  const years = Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - index)
  const [mode, setMode] = useState('encadrement')
  const [primaryFilter, setPrimaryFilter] = useState('pending')
  const [filters, setFilters] = useState(() => ({ type: '', year: '' }))
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  const hasSecondaryFilters = Boolean(filters.type || filters.year)

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const fetchData = useCallback(async () => {
    if (!currentEnseignantId) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const select = 'id, resident_id, title, year, status, validation_status, validation_feedback, journal_or_event, authors, doi_or_url, initial_validated_at, final_validated_at, type_id, encadrant_id, resident:profiles!resident_id(full_name), encadrant:profiles!encadrant_id(full_name), travail_types(name, color_hex), travail_auteurs(id, profile_id, external_name, author_order, profiles(id, full_name, role))'

    let query = supabase
      .from('travaux_scientifiques')
      .select(select)
      .order('year', { ascending: false })
      .limit(500)

    if (mode === 'encadrement') {
      query = query.eq('encadrant_id', currentEnseignantId)
    } else {
      const { data: authorRows } = await supabase
        .from('travail_auteurs')
        .select('travail_id')
        .eq('profile_id', currentEnseignantId)
      const authorIds = [...new Set((authorRows ?? []).map((row) => row.travail_id).filter(Boolean))]
      if (authorIds.length === 0) {
        setData([])
        setLoading(false)
        return
      }
      query = query.in('id', authorIds)
    }

    if (filters.type) query = query.eq('type_id', filters.type)
    if (filters.year) query = query.eq('year', Number.parseInt(filters.year, 10))

    const { data: rows, error: queryError } = await query
    if (queryError) setError(queryError.message)
    setData(rows ?? [])
    setLoading(false)
  }, [currentEnseignantId, filters, mode])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function switchMode(nextMode) {
    setMode(nextMode)
    setPrimaryFilter(nextMode === 'encadrement' ? 'pending' : 'first')
    setFilters({ type: '', year: '' })
  }

  const visibleData = useMemo(() => {
    if (mode === 'mentions') return data.filter((travail) => matchMentionPosition(travail, currentEnseignantId, primaryFilter))
    if (primaryFilter !== 'all') return data.filter((travail) => matchEncadrementWorkflow(travail, primaryFilter))
    return data
  }, [currentEnseignantId, data, mode, primaryFilter])

  const primaryTabs = mode === 'encadrement' ? ENCADREMENT_TABS : MENTION_TABS
  const counts = useMemo(() => Object.fromEntries(primaryTabs.map((tab) => [
    tab.id,
    data.filter((travail) => mode === 'mentions'
      ? matchMentionPosition(travail, currentEnseignantId, tab.id)
      : matchEncadrementWorkflow(travail, tab.id)).length,
  ])), [currentEnseignantId, data, mode, primaryTabs])

  async function handleExport() {
    if (visibleData.length === 0) return
    setExporting(true)
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const navy = [13, 43, 78]
    const pageW = doc.internal.pageSize.getWidth()

    doc.setFillColor(...navy)
    doc.rect(0, 0, pageW, 26, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Logbook Chirurgie Pediatrique', 14, 10)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(mode === 'encadrement' ? 'Travaux encadres' : 'Travaux ou mon nom est cite', 14, 16)
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(8)
    doc.text(`Exporte le ${fmtToday()} - ${visibleData.length} travail(x)`, 14, 31)

    autoTable(doc, {
      startY: 36,
      head: [['Titre', 'Résident', 'Type', 'Statut', 'Validation', 'Encadrant', 'Journal / Congrès', 'Auteurs', 'Année']],
      body: visibleData.map((travail) => [
        travail.title ?? '-',
        travail.resident?.full_name ?? '-',
        travail.travail_types?.name ?? '-',
        TRAVAIL_STATUS_LABELS[travail.status] ?? travail.status,
        TRAVAIL_VALIDATION_LABELS[travail.validation_status] ?? travail.validation_status,
        travail.encadrant?.full_name ?? '-',
        travail.journal_or_event ?? '-',
        formatTravailAuthors(travail) || '-',
        String(travail.year),
      ]),
      headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      margin: { left: 14, right: 14 },
      didDrawPage: (pageData) => {
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Page ${pageData.pageNumber} / ${doc.internal.getNumberOfPages()}`, pageW / 2, 203, { align: 'center' })
      },
    })

    doc.save(mode === 'encadrement' ? 'travaux_encadres.pdf' : 'travaux_mentions.pdf')
    setExporting(false)
  }

  return (
    <div>
      <StatusTabs
        tabs={MODE_TABS.map((tab) => ({ value: tab.id, label: tab.label }))}
        activeValue={mode}
        onChange={switchMode}
        columns={2}
        className="mb-5"
      />

      <StatusTabs
        tabs={primaryTabs.map((tab) => ({ value: tab.id, label: tab.label }))}
        activeValue={primaryFilter}
        counts={counts}
        onChange={setPrimaryFilter}
        columns={4}
        className="mb-5"
      />

      <FilterPanel active={hasSecondaryFilters} className="mb-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Type</label>
            <select value={filters.type} onChange={(event) => setFilter('type', event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              <option value="">Tous les types</option>
              {travailTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Année</label>
            <select value={filters.year} onChange={(event) => setFilter('year', event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              <option value="">Toutes les années</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          {hasSecondaryFilters && (
            <button
              type="button"
              onClick={() => setFilters({ type: '', year: '' })}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 sm:col-span-2"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </FilterPanel>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">{visibleData.length} resultat(s)</p>
        {visibleData.length > 0 && (
          <button type="button" onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50"
            style={{ color: 'var(--color-navy)' }}>
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} strokeWidth={1.75} />}
            Exporter
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonList count={4} variant="row" />
      ) : (
        <div className="space-y-2">
          {visibleData.map((travail) => (
            <TravailCard
              key={travail.id}
              travail={travail}
              currentEnseignantId={currentEnseignantId}
              showMention={mode === 'mentions'}
            />
          ))}
          {visibleData.length === 0 && <p className="rounded-2xl bg-white py-8 text-center text-sm text-slate-400">Aucun travail</p>}
        </div>
      )}
    </div>
  )
}

function TravailCard({ travail, currentEnseignantId, showMention }) {
  const statusStyle = TRAVAIL_STATUS_STYLES[travail.status] ?? { bg: '#f1f5f9', color: '#64748b' }
  const validationStyle = TRAVAIL_VALIDATION_STYLES[travail.validation_status] ?? { bg: '#f1f5f9', color: '#64748b' }
  const typeColor = travail.travail_types?.color_hex ?? 'var(--color-navy)'
  const mentionLabel = getMentionLabel(travail, currentEnseignantId)
  const needsAction = travail.encadrant_id === currentEnseignantId && ['pending_initial', 'pending_final'].includes(travail.validation_status)

  return (
    <AppCard
      as={Link}
      href={`/enseignant/travaux/${travail.id}?from=travaux`}
      className="block cursor-pointer px-4 py-3.5 transition-shadow hover:shadow-md"
    >
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: `${typeColor}20`, color: typeColor }}>
              {travail.travail_types?.name ?? 'Travail'}
            </span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: validationStyle.bg, color: validationStyle.color }}>
              {TRAVAIL_VALIDATION_LABELS[travail.validation_status] ?? travail.validation_status}
            </span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
              {TRAVAIL_STATUS_LABELS[travail.status] ?? travail.status}
            </span>
            {showMention && mentionLabel && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {mentionLabel}
              </span>
            )}
            {needsAction && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                A traiter
              </span>
            )}
          </div>
          <p className="text-sm font-semibold leading-snug text-slate-800">{travail.title}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
            {travail.resident?.full_name ?? '-'} - {travail.year} - {formatTravailAuthors(travail) || 'Auteurs non renseignés'}
          </p>
          {travail.encadrant?.full_name && <p className="mt-1 text-[11px] text-slate-400">Encadrant : {travail.encadrant.full_name}</p>}
          {travail.validation_feedback && <p className="mt-1 text-xs text-red-500">{travail.validation_feedback}</p>}
        </div>
        <ChevronRight size={16} className="mt-1 flex-shrink-0 text-slate-300" />
      </div>
    </AppCard>
  )
}

function matchEncadrementWorkflow(travail, filter) {
  if (filter === 'pending') return ['pending_initial', 'pending_final'].includes(travail.validation_status)
  if (filter === 'validated') return ['initial_validated', 'final_validated'].includes(travail.validation_status)
  if (filter === 'refused') return travail.validation_status === 'refused'
  return true
}

function getAuthorPosition(travail, profileId) {
  const authors = (travail.travail_auteurs ?? []).slice().sort((a, b) => (a.author_order ?? 0) - (b.author_order ?? 0))
  const index = authors.findIndex((author) => author.profile_id === profileId)
  return { index, count: authors.length }
}

function matchMentionPosition(travail, profileId, filter) {
  const { index, count } = getAuthorPosition(travail, profileId)
  if (index < 0) return false
  if (filter === 'first') return index === 0
  if (filter === 'second') return index === 1
  if (filter === 'other') return index > 1 && index !== count - 1
  if (filter === 'last') return count > 1 && index === count - 1
  return true
}

function getMentionLabel(travail, profileId) {
  const { index, count } = getAuthorPosition(travail, profileId)
  if (index === 0) return '1er auteur'
  if (index === 1) return '2e auteur'
  if (count > 1 && index === count - 1) return 'Dernier auteur'
  if (index > 1) return 'Autre position'
  return ''
}
