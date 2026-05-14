'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, FileDown, Loader2, X } from 'lucide-react'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'

const STATUS_LABELS = { pending: 'En attente', validated: 'Valide', refused: 'Refuse' }

const STATUS_OPTIONS = [
  { value: 'validated', label: 'Validés' },
  { value: 'pending', label: 'En attente' },
  { value: 'refused', label: 'Refusés' },
]
const ACTIVITY_OPTIONS = [
  { value: 'expose', label: 'Exposé' },
  { value: 'supervise', label: 'Supervisé' },
  { value: 'autonome', label: 'Autonome' },
]

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const DEFAULT_FILTERS = {
  statuts: ['validated', 'pending', 'refused'],
  activites: ['expose', 'supervise', 'autonome'],
  dateFrom: '',
  dateTo: '',
}

export default function ExportFicheButton({ resident, realisations, year }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const wrapperRef = useRef(null)

  // Close panel on outside click
  useEffect(() => {
    function onMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  function toggleStatut(value) {
    setFilters((f) => ({
      ...f,
      statuts: f.statuts.includes(value) ? f.statuts.filter((s) => s !== value) : [...f.statuts, value],
    }))
  }

  function toggleActivite(value) {
    setFilters((f) => ({
      ...f,
      activites: f.activites.includes(value) ? f.activites.filter((a) => a !== value) : [...f.activites, value],
    }))
  }

  function getFiltered() {
    return realisations.filter((r) => {
      if (!filters.statuts.includes(r.status)) return false
      if (!filters.activites.includes(r.activity_type)) return false
      if (filters.dateFrom && r.performed_at < filters.dateFrom) return false
      if (filters.dateTo && r.performed_at > `${filters.dateTo}T23:59:59`) return false
      return true
    })
  }

  async function handleExport() {
    setLoading(true)
    setOpen(false)
    const filtered = getFiltered()

    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const navy = [13, 43, 78]
    const lightBlue = [232, 244, 252]
    const pageW = doc.internal.pageSize.getWidth()

    // ── Header ──
    doc.setFillColor(...navy)
    doc.rect(0, 0, pageW, 32, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Logbook Chirurgie Pediatrique', 14, 11)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Fiche individuelle resident', 14, 18)
    doc.text(`Exportee le ${fmtDate(new Date().toISOString())}`, 14, 24)

    // ── Resident info ──
    doc.setFillColor(...lightBlue)
    doc.rect(14, 36, pageW - 28, 22, 'F')
    doc.setTextColor(...navy)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(resident.full_name ?? '—', 20, 45)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(`Annee ${year} de residanat · Promotion ${resident.promotion ?? '—'}`, 20, 52)

    // ── Stats boxes (computed from filtered data) ──
    const statItems = [
      { label: 'Total', value: filtered.length },
      { label: 'Valides', value: filtered.filter((r) => r.status === 'validated').length },
      { label: 'En attente', value: filtered.filter((r) => r.status === 'pending').length },
      { label: 'Refuses', value: filtered.filter((r) => r.status === 'refused').length },
    ]
    const boxW = (pageW - 28) / statItems.length
    statItems.forEach((stat, i) => {
      const x = 14 + i * boxW
      doc.setFillColor(248, 250, 252)
      doc.rect(x, 62, boxW - 2, 16, 'F')
      doc.setTextColor(...navy)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text(String(stat.value), x + boxW / 2 - 1, 72, { align: 'center' })
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139)
      doc.text(stat.label, x + boxW / 2 - 1, 76, { align: 'center' })
    })

    // ── Active filter description ──
    const filterParts = []
    if (filters.statuts.length < 3) filterParts.push(`Statuts : ${filters.statuts.map((s) => STATUS_LABELS[s]).join(', ')}`)
    if (filters.activites.length < 3) filterParts.push(`Types : ${filters.activites.map((a) => ACTIVITY_TYPE_LABELS[a]).join(', ')}`)
    if (filters.dateFrom) filterParts.push(`Du ${fmtDate(filters.dateFrom)}`)
    if (filters.dateTo) filterParts.push(`Au ${fmtDate(filters.dateTo)}`)

    let tableStartY = 88
    if (filterParts.length > 0) {
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(100, 116, 139)
      doc.text(`Filtres : ${filterParts.join(' · ')}`, 14, 83)
      tableStartY = 93
    }

    // ── Gestures table ──
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...navy)
    doc.text(`Gestes realises (${filtered.length})`, 14, tableStartY - 3)

    autoTable(doc, {
      startY: tableStartY,
      head: [['Date', 'Geste', 'Type', 'Statut', 'Enseignant']],
      body: filtered.map((r) => [
        fmtDate(r.performed_at),
        r.procedures?.name ?? '—',
        ACTIVITY_TYPE_LABELS[r.activity_type] ?? '—',
        STATUS_LABELS[r.status] ?? r.status,
        r.profiles?.full_name ?? '—',
      ]),
      headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 65 },
        2: { cellWidth: 35 },
        3: { cellWidth: 24 },
        4: { cellWidth: 36 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (d) => {
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Page ${d.pageNumber} / ${doc.internal.getNumberOfPages()}`, pageW / 2, 290, { align: 'center' })
      },
    })

    doc.save(`fiche_${resident.full_name?.replace(/\s+/g, '_') ?? 'resident'}.pdf`)
    setLoading(false)
  }

  const filtered = getFiltered()
  const canExport = filtered.length > 0 && filters.statuts.length > 0 && filters.activites.length > 0

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
        style={{ color: 'var(--color-navy)' }}
      >
        {loading
          ? <Loader2 size={15} className="animate-spin" />
          : <FileDown size={15} strokeWidth={1.75} />}
        Exporter PDF
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          {/* Panel header */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Filtres d&apos;export</p>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          {/* Statuts */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-slate-500">Statuts</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(({ value, label }) => {
                const on = filters.statuts.includes(value)
                return (
                  <button key={value} type="button" onClick={() => toggleStatut(value)}
                    className="rounded-lg border px-3 py-1 text-xs font-medium transition"
                    style={on
                      ? { borderColor: 'var(--color-navy)', backgroundColor: 'var(--color-navy)', color: 'white' }
                      : { borderColor: '#e2e8f0', color: '#475569' }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Types d'activité */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-slate-500">Type d&apos;activité</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.map(({ value, label }) => {
                const on = filters.activites.includes(value)
                return (
                  <button key={value} type="button" onClick={() => toggleActivite(value)}
                    className="rounded-lg border px-3 py-1 text-xs font-medium transition"
                    style={on
                      ? { borderColor: 'var(--color-navy)', backgroundColor: 'var(--color-navy)', color: 'white' }
                      : { borderColor: '#e2e8f0', color: '#475569' }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Période */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Du</p>
              <input type="date" value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-sky-400" />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Au</p>
              <input type="date" value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-sky-400" />
            </div>
          </div>

          {/* Reset */}
          {JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS) && (
            <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mb-3 w-full text-center text-xs text-slate-400 underline hover:text-slate-600">
              Réinitialiser les filtres
            </button>
          )}

          {/* Generate */}
          <button onClick={handleExport} disabled={!canExport}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-navy)' }}>
            Générer — {filtered.length} geste{filtered.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
