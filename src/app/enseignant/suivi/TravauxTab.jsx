'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileDown, Search, Loader2 } from 'lucide-react'

const STATUS_LABELS = { soumis: 'Soumis', accepte: 'Accepté', publie: 'Publié', presente: 'Présenté' }
const STATUS_STYLES = {
  soumis:   { bg: '#fef9c3', color: '#854d0e' },
  accepte:  { bg: '#dbeafe', color: '#1e40af' },
  publie:   { bg: '#dcfce7', color: '#166534' },
  presente: { bg: '#f3e8ff', color: '#6b21a8' },
}

function fmtToday() {
  return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function TravauxTab({ residents, travailTypes }) {
  const [filters, setFilters] = useState({ resident: '', type: '', status: '' })
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [fetched, setFetched] = useState(false)

  function set(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  async function fetchData(f) {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('travaux_scientifiques')
      .select('id, title, year, status, journal_or_event, authors, type_id, resident:profiles!resident_id(full_name), travail_types(name, color_hex)')
      .order('year', { ascending: false })
      .limit(500)

    if (f.resident) query = query.eq('resident_id', f.resident)
    if (f.type)     query = query.eq('type_id', f.type)
    if (f.status)   query = query.eq('status', f.status)

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
    doc.text('Travaux scientifiques — tous résidents', 14, 16)
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(8)
    doc.text(`Exporté le ${fmtToday()} — ${data.length} travail(x)`, 14, 31)

    autoTable(doc, {
      startY: 36,
      head: [['Titre', 'Résident', 'Type', 'Statut', 'Journal / Congrès', 'Auteurs', 'Année']],
      body: data.map(t => [
        t.title ?? '—',
        t.resident?.full_name ?? '—',
        t.travail_types?.name ?? '—',
        STATUS_LABELS[t.status] ?? t.status,
        t.journal_or_event ?? '—',
        t.authors ?? '—',
        String(t.year),
      ]),
      headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 38 },
        2: { cellWidth: 25 },
        3: { cellWidth: 22 },
        4: { cellWidth: 50 },
        5: { cellWidth: 35 },
        6: { cellWidth: 12 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (d) => {
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Page ${d.pageNumber} / ${doc.internal.getNumberOfPages()}`, pageW / 2, 203, { align: 'center' })
      },
    })

    doc.save(`travaux_tous_residents.pdf`)
    setExporting(false)
  }

  return (
    <div>
      {/* Filtres */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Résident</label>
            <select value={filters.resident} onChange={e => set('resident', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Tous</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
            <select value={filters.type} onChange={e => set('type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Tous</option>
              {travailTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
            <select value={filters.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none">
              <option value="">Tous</option>
              <option value="soumis">Soumis</option>
              <option value="accepte">Accepté</option>
              <option value="publie">Publié</option>
              <option value="presente">Présenté</option>
            </select>
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
            {data.map(t => {
              const st = STATUS_STYLES[t.status] ?? { bg: '#f1f5f9', color: '#64748b' }
              return (
                <div key={t.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.resident?.full_name ?? '—'} · {t.year}
                      {t.journal_or_event ? ` · ${t.journal_or_event}` : ''}
                    </p>
                    {t.travail_types && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                        style={{ backgroundColor: t.travail_types.color_hex + '25', color: t.travail_types.color_hex }}>
                        {t.travail_types.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ backgroundColor: st.bg, color: st.color }}>
                    {STATUS_LABELS[t.status] ?? t.status}
                  </span>
                </div>
              )
            })}
            {data.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-10">Aucun travail trouvé pour ces filtres</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
