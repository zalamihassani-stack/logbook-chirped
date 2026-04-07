'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileDown, Search, Loader2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'

const LEVELS = { 1: 'Observation', 2: 'Aide opératoire', 3: 'Sous supervision', 4: 'Autonome' }
const STATUS_LABELS = { pending: 'En attente', validated: 'Validé', refused: 'Refusé' }
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtDateLong(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
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

  function set(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  async function fetchData(f) {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('realisations')
      .select('id, performed_at, participation_level, status, resident_year_at_time, procedures(name), resident:profiles!resident_id(full_name), enseignant:profiles!enseignant_id(full_name)')
      .order('performed_at', { ascending: false })
      .limit(500)

    if (f.resident)   query = query.eq('resident_id', f.resident)
    if (f.from)       query = query.gte('performed_at', f.from)
    if (f.to)         query = query.lte('performed_at', f.to + 'T23:59:59')
    if (f.enseignant) query = query.eq('enseignant_id', f.enseignant)
    if (f.procedure)  query = query.eq('procedure_id', f.procedure)
    if (f.year)       query = query.eq('resident_year_at_time', parseInt(f.year))
    if (f.status)     query = query.eq('status', f.status)

    const { data: rows } = await query
    setData(rows ?? [])
    setLoading(false)
    setFetched(true)
  }

  function handleSearch(e) {
    e.preventDefault()
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
    doc.text('Actes réalisés — tous résidents', 14, 16)
    const period = filters.from || filters.to
      ? `du ${fmtDateLong(filters.from)} au ${fmtDateLong(filters.to)}`
      : 'toutes dates'
    doc.text(period, 14, 21)
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(8)
    doc.text(`Exporté le ${fmtDate(today)} — ${data.length} acte(s)`, 14, 31)

    autoTable(doc, {
      startY: 36,
      head: [['Date', 'Résident', 'Geste', 'Niveau', 'Statut', 'Enseignant', 'Année résidanat']],
      body: data.map(r => [
        fmtDate(r.performed_at),
        r.resident?.full_name ?? '—',
        r.procedures?.name ?? '—',
        LEVELS[r.participation_level] ?? '—',
        STATUS_LABELS[r.status] ?? r.status,
        r.enseignant?.full_name ?? '—',
        r.resident_year_at_time ? `Année ${r.resident_year_at_time}` : '—',
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
      didDrawPage: (d) => {
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Page ${d.pageNumber} / ${doc.internal.getNumberOfPages()}`, pageW / 2, 203, { align: 'center' })
      },
    })

    doc.save(`actes_${filters.from ?? 'debut'}_${filters.to ?? 'fin'}.pdf`)
    setExporting(false)
  }

  return (
    <div>
      {/* Filtres */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Résident</label>
            <select value={filters.resident} onChange={e => set('resident', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Tous</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Enseignant</label>
            <select value={filters.enseignant} onChange={e => set('enseignant', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Tous</option>
              {enseignants.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Geste</label>
            <select value={filters.procedure} onChange={e => set('procedure', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Tous</option>
              {procedures.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
            <select value={filters.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="validated">Validés</option>
              <option value="refused">Refusés</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Année résidanat</label>
            <select value={filters.year} onChange={e => set('year', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Toutes</option>
              {[1,2,3,4,5].map(y => <option key={y} value={y}>Année {y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Du</label>
            <input type="date" value={filters.from} onChange={e => set('from', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Au</label>
            <input type="date" value={filters.to} onChange={e => set('to', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          {fetched && data.length > 0 && (
            <button type="button" onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50"
              style={{ color: '#0D2B4E' }}>
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} strokeWidth={1.75} />}
              Exporter PDF
            </button>
          )}
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: '#0D2B4E' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} strokeWidth={1.75} />}
            Rechercher
          </button>
        </div>
      </form>

      {/* Résultats */}
      {!fetched && (
        <p className="text-center text-sm text-slate-400 py-10">Appliquez des filtres puis cliquez sur Rechercher</p>
      )}

      {fetched && (
        <>
          <p className="text-xs text-slate-500 mb-3">{data.length} résultat(s)</p>
          <div className="space-y-2">
            {data.map(r => (
              <div key={r.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{r.procedures?.name ?? '—'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {r.resident?.full_name ?? '—'} · {fmtDate(r.performed_at)} · {LEVELS[r.participation_level] ?? '—'}
                    {r.resident_year_at_time ? ` · Année ${r.resident_year_at_time}` : ''}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.enseignant?.full_name ?? '—'}</p>
                </div>
                <Badge status={r.status} />
              </div>
            ))}
            {data.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-10">Aucun acte trouvé pour ces filtres</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
