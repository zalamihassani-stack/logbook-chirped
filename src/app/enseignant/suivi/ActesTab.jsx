'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileDown, Search, Loader2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/SkeletonCard'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'

const STATUS_LABELS = { pending: 'En attente', validated: 'Valide', refused: 'Refuse' }

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateLong(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function ActesTab({ residents, procedures, enseignants }) {
  const now = new Date()
  const firstOfYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
  const today = now.toISOString().slice(0, 10)

  const [filters, setFilters] = useState({
    resident: '', from: firstOfYear, to: today,
    enseignant: '', procedure: '', year: '', status: '',
  })
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [fetched, setFetched] = useState(false)

  function set(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  async function fetchData(nextFilters) {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('realisations')
      .select('id, performed_at, activity_type, status, resident_year_at_time, procedures(name), resident:profiles!resident_id(full_name), enseignant:profiles!enseignant_id(full_name)')
      .order('performed_at', { ascending: false })
      .limit(500)

    if (nextFilters.resident) query = query.eq('resident_id', nextFilters.resident)
    if (nextFilters.from) query = query.gte('performed_at', nextFilters.from)
    if (nextFilters.to) query = query.lte('performed_at', `${nextFilters.to}T23:59:59`)
    if (nextFilters.enseignant) query = query.eq('enseignant_id', nextFilters.enseignant)
    if (nextFilters.procedure) query = query.eq('procedure_id', nextFilters.procedure)
    if (nextFilters.year) query = query.eq('resident_year_at_time', Number.parseInt(nextFilters.year, 10))
    if (nextFilters.status) query = query.eq('status', nextFilters.status)

    const { data: rows } = await query
    setData(rows ?? [])
    setLoading(false)
    setFetched(true)
  }

  useEffect(() => {
    fetchData(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearch(event) {
    event.preventDefault()
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
    doc.text('Logbook Chirurgie Pediatrique', 14, 10)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Actes realises - tous residents', 14, 16)
    const period = filters.from || filters.to ? `du ${fmtDateLong(filters.from)} au ${fmtDateLong(filters.to)}` : 'toutes dates'
    doc.text(period, 14, 21)
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(8)
    doc.text(`Exporte le ${fmtDate(today)} - ${data.length} acte(s)`, 14, 31)

    autoTable(doc, {
      startY: 36,
      head: [['Date', 'Resident', 'Geste', 'Type', 'Statut', 'Enseignant', 'Annee residanat']],
      body: data.map((realisation) => [
        fmtDate(realisation.performed_at),
        realisation.resident?.full_name ?? '—',
        realisation.procedures?.name ?? '—',
        ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '—',
        STATUS_LABELS[realisation.status] ?? realisation.status,
        realisation.enseignant?.full_name ?? '—',
        realisation.resident_year_at_time ? `Annee ${realisation.resident_year_at_time}` : '—',
      ]),
      headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 38 },
        2: { cellWidth: 55 },
        3: { cellWidth: 30 },
        4: { cellWidth: 24 },
        5: { cellWidth: 38 },
        6: { cellWidth: 28 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (tableData) => {
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Page ${tableData.pageNumber} / ${doc.internal.getNumberOfPages()}`, pageW / 2, 203, { align: 'center' })
      },
    })

    doc.save(`actes_${filters.from ?? 'debut'}_${filters.to ?? 'fin'}.pdf`)
    setExporting(false)
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Resident</label>
            <select value={filters.resident} onChange={(event) => set('resident', event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Tous</option>
              {residents.map((resident) => <option key={resident.id} value={resident.id}>{resident.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Enseignant</label>
            <select value={filters.enseignant} onChange={(event) => set('enseignant', event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Tous</option>
              {enseignants.map((enseignant) => <option key={enseignant.id} value={enseignant.id}>{enseignant.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Geste</label>
            <select value={filters.procedure} onChange={(event) => set('procedure', event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Tous</option>
              {procedures.map((procedure) => <option key={procedure.id} value={procedure.id}>{procedure.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
            <select value={filters.status} onChange={(event) => set('status', event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="validated">Valides</option>
              <option value="refused">Refuses</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Annee residanat</label>
            <select value={filters.year} onChange={(event) => set('year', event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Toutes</option>
              {[1, 2, 3, 4, 5].map((year) => <option key={year} value={year}>Annee {year}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Du</label>
            <input type="date" value={filters.from} onChange={(event) => set('from', event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Au</label>
            <input type="date" value={filters.to} onChange={(event) => set('to', event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          {fetched && data.length > 0 && (
            <button type="button" onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50"
              style={{ color: 'var(--color-navy)' }}>
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} strokeWidth={1.75} />}
              Exporter PDF
            </button>
          )}
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-navy)' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} strokeWidth={1.75} />}
            Rechercher
          </button>
        </div>
      </form>

      {!fetched && loading && <SkeletonList count={5} variant="row" />}

      {fetched && (
        <>
          <p className="text-xs text-slate-500 mb-3">{data.length} resultat(s)</p>
          <div className="space-y-2">
            {data.map((realisation) => (
              <div key={realisation.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{realisation.procedures?.name ?? '—'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {realisation.resident?.full_name ?? '—'} · {fmtDate(realisation.performed_at)} · {ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '—'}
                    {realisation.resident_year_at_time ? ` · Annee ${realisation.resident_year_at_time}` : ''}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{realisation.enseignant?.full_name ?? '—'}</p>
                </div>
                <Badge status={realisation.status} />
              </div>
            ))}
            {data.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-10">Aucun acte trouve pour ces filtres</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
