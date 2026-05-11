'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validateTravail, refuseTravail } from '@/app/actions/enseignant'
import { FileDown, Search, Loader2 } from 'lucide-react'
import {
  ALL_TRAVAIL_STATUS_OPTIONS,
  formatTravailAuthors,
  TRAVAIL_STATUS_LABELS,
  TRAVAIL_STATUS_STYLES,
  TRAVAIL_VALIDATION_LABELS,
  TRAVAIL_VALIDATION_STYLES,
} from '@/lib/travaux'

function fmtToday() {
  return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function TravauxTab({ residents, enseignants = [], travailTypes }) {
  const people = useMemo(() => [...enseignants, ...residents], [enseignants, residents])
  const years = Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - index)
  const [filters, setFilters] = useState({ resident: '', auteur: '', encadrant: '', type: '', status: '', validation: '', year: '' })
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')

  function set(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  async function fetchData(nextFilters) {
    setLoading(true)
    setError('')
    const supabase = createClient()
    let authorIds = null

    if (nextFilters.auteur) {
      const { data: authorRows } = await supabase
        .from('travail_auteurs')
        .select('travail_id')
        .eq('profile_id', nextFilters.auteur)
      authorIds = [...new Set((authorRows ?? []).map((row) => row.travail_id))]
      if (authorIds.length === 0) {
        setData([])
        setLoading(false)
        setFetched(true)
        return
      }
    }

    let query = supabase
      .from('travaux_scientifiques')
      .select('id, title, year, status, validation_status, validation_feedback, journal_or_event, authors, type_id, encadrant_id, resident:profiles!resident_id(full_name), encadrant:profiles!encadrant_id(full_name), travail_types(name, color_hex), travail_auteurs(id, profile_id, external_name, author_order, profiles(id, full_name, role))')
      .order('year', { ascending: false })
      .limit(500)

    if (nextFilters.resident) query = query.eq('resident_id', nextFilters.resident)
    if (nextFilters.encadrant) query = query.eq('encadrant_id', nextFilters.encadrant)
    if (nextFilters.type) query = query.eq('type_id', nextFilters.type)
    if (nextFilters.status) query = query.eq('status', nextFilters.status)
    if (nextFilters.validation) query = query.eq('validation_status', nextFilters.validation)
    if (nextFilters.year) query = query.eq('year', Number.parseInt(nextFilters.year, 10))
    if (authorIds) query = query.in('id', authorIds)

    const { data: rows, error: queryError } = await query
    if (queryError) setError(queryError.message)
    setData(rows ?? [])
    setLoading(false)
    setFetched(true)
  }

  function handleSearch(event) {
    event.preventDefault()
    fetchData(filters)
  }

  async function handleValidation(travailId, action) {
    setActionLoading(`${action}-${travailId}`)
    setError('')
    const feedback = action === 'refuse' ? window.prompt('Motif ou correction demandée ?') : ''
    if (action === 'refuse' && feedback === null) {
      setActionLoading('')
      return
    }

    const res = action === 'validate'
      ? await validateTravail(travailId)
      : await refuseTravail(travailId, feedback)

    setActionLoading('')
    if (res.error) {
      setError(res.error)
      return
    }
    fetchData(filters)
  }

  async function handleExport() {
    if (data.length === 0) return
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
    doc.text('Logbook Chirurgie Pédiatrique', 14, 10)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Travaux scientifiques - tous résidents', 14, 16)
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(8)
    doc.text(`Exporté le ${fmtToday()} - ${data.length} travail(x)`, 14, 31)

    autoTable(doc, {
      startY: 36,
      head: [['Titre', 'Résident', 'Type', 'Statut', 'Validation', 'Encadrant', 'Journal / Congrès', 'Auteurs', 'Année']],
      body: data.map((travail) => [
        travail.title ?? '—',
        travail.resident?.full_name ?? '—',
        travail.travail_types?.name ?? '—',
        TRAVAIL_STATUS_LABELS[travail.status] ?? travail.status,
        TRAVAIL_VALIDATION_LABELS[travail.validation_status] ?? travail.validation_status,
        travail.encadrant?.full_name ?? '—',
        travail.journal_or_event ?? '—',
        formatTravailAuthors(travail) || '—',
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

    doc.save('travaux_tous_residents.pdf')
    setExporting(false)
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <FilterSelect label="Résident" value={filters.resident} onChange={(value) => set('resident', value)} options={residents} />
          <FilterSelect label="Auteur" value={filters.auteur} onChange={(value) => set('auteur', value)} options={people} />
          <FilterSelect label="Encadrant" value={filters.encadrant} onChange={(value) => set('encadrant', value)} options={enseignants} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Type</label>
            <select value={filters.type} onChange={(event) => set('type', event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              <option value="">Tous</option>
              {travailTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Statut</label>
            <select value={filters.status} onChange={(event) => set('status', event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              <option value="">Tous</option>
              {ALL_TRAVAIL_STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Validation</label>
            <select value={filters.validation} onChange={(event) => set('validation', event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              <option value="">Toutes</option>
              {Object.entries(TRAVAIL_VALIDATION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Année</label>
            <select value={filters.year} onChange={(event) => set('year', event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              <option value="">Toutes</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3">
          {fetched && data.length > 0 && (
            <button type="button" onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
              style={{ color: '#0D2B4E' }}>
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} strokeWidth={1.75} />}
              Exporter PDF
            </button>
          )}
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: '#0D2B4E' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} strokeWidth={1.75} />}
            Rechercher
          </button>
        </div>
      </form>

      {!fetched && <p className="py-10 text-center text-sm text-slate-400">Appliquez des filtres puis cliquez sur Rechercher</p>}

      {fetched && (
        <>
          <p className="mb-3 text-xs text-slate-500">{data.length} résultat(s)</p>
          <div className="space-y-2">
            {data.map((travail) => {
              const statusStyle = TRAVAIL_STATUS_STYLES[travail.status] ?? { bg: '#f1f5f9', color: '#64748b' }
              const validationStyle = TRAVAIL_VALIDATION_STYLES[travail.validation_status] ?? { bg: '#f1f5f9', color: '#64748b' }
              const canValidate = travail.validation_status === 'pending_initial' || travail.validation_status === 'pending_final'
              return (
                <div key={travail.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{travail.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {travail.resident?.full_name ?? '—'} · {travail.year}
                      {travail.encadrant?.full_name ? ` · Encadrant : ${travail.encadrant.full_name}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatTravailAuthors(travail) || 'Auteurs non renseignés'}</p>
                    {travail.travail_types && (
                      <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `${travail.travail_types.color_hex}25`, color: travail.travail_types.color_hex }}>
                        {travail.travail_types.name}
                      </span>
                    )}
                    {travail.validation_feedback && (
                      <p className="mt-1 text-xs text-red-500">{travail.validation_feedback}</p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                      {TRAVAIL_STATUS_LABELS[travail.status] ?? travail.status}
                    </span>
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: validationStyle.bg, color: validationStyle.color }}>
                      {TRAVAIL_VALIDATION_LABELS[travail.validation_status] ?? travail.validation_status}
                    </span>
                    {canValidate && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleValidation(travail.id, 'validate')}
                          disabled={Boolean(actionLoading)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
                        >
                          {actionLoading === `validate-${travail.id}` ? '...' : 'Valider'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleValidation(travail.id, 'refuse')}
                          disabled={Boolean(actionLoading)}
                          className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 disabled:opacity-60"
                        >
                          {actionLoading === `refuse-${travail.id}` ? '...' : 'Refuser'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {data.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Aucun travail trouvé pour ces filtres</p>}
          </div>
        </>
      )}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
        <option value="">Tous</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.full_name}</option>)}
      </select>
    </div>
  )
}
