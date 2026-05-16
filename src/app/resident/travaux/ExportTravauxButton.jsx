'use client'
import { useState } from 'react'
import { FileDown, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STATUS_LABELS = { soumis: 'Soumis', accepte: 'Accepté', publie: 'Publié', presente: 'Présenté' }
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function fmtToday() {
  return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function labelPeriod(fromMonth, fromYear, toMonth, toYear) {
  return `${MONTHS[fromMonth - 1]} ${fromYear} — ${MONTHS[toMonth - 1]} ${toYear}`
}

export default function ExportTravauxButton({ residentName }) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [open, setOpen] = useState(false)
  const [fromMonth, setFromMonth] = useState(1)
  const [fromYear, setFromYear] = useState(currentYear - 1)
  const [toMonth, setToMonth] = useState(currentMonth)
  const [toYear, setToYear] = useState(currentYear)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function isValidRange() {
    return fromYear < toYear || (fromYear === toYear && fromMonth <= toMonth)
  }

  async function handleExport() {
    if (!isValidRange()) { setError('La date de début doit être antérieure à la date de fin.'); return }
    setLoading(true); setError('')

    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('travaux_scientifiques')
      .select('title, year, status, journal_or_event, authors, doi_or_url, travail_types(name)')
      .gte('year', fromYear)
      .lte('year', toYear)
      .order('year', { ascending: false })

    setLoading(false)
    if (err) { setError('Erreur lors du chargement des données.'); return }
    if (!data || data.length === 0) { setError('Aucun travail trouvé pour cette période.'); return }

    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const navy = [13, 43, 78]
    const pageW = doc.internal.pageSize.getWidth()

    // En-tête
    doc.setFillColor(...navy)
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Logbook Chirurgie Pédiatrique', 14, 11)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Récapitulatif des travaux scientifiques', 14, 18)
    doc.text(labelPeriod(fromMonth, fromYear, toMonth, toYear), 14, 24)

    // Infos résident
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(9)
    if (residentName) doc.text(`Résident : ${residentName}`, 14, 36)
    doc.text(`Exporté le ${fmtToday()}`, 14, residentName ? 41 : 36)

    autoTable(doc, {
      startY: residentName ? 46 : 41,
      head: [['Titre', 'Type', 'Statut', 'Journal / Congrès', 'Auteurs', 'Année']],
      body: data.map(t => [
        t.title ?? '—',
        t.travail_types?.name ?? '—',
        STATUS_LABELS[t.status] ?? t.status,
        t.journal_or_event ?? '—',
        t.authors ?? '—',
        String(t.year),
      ]),
      headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 40 },
        4: { cellWidth: 30 },
        5: { cellWidth: 12 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (d) => {
        const pageCount = doc.internal.getNumberOfPages()
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`Page ${d.pageNumber} / ${pageCount}`, pageW / 2, 290, { align: 'center' })
      },
    })

    doc.save(`travaux_${MONTHS[fromMonth-1]}_${fromYear}_${MONTHS[toMonth-1]}_${toYear}.pdf`)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError('') }}
        className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 sm:px-4"
        style={{ color: '#0D2B4E' }}
      >
        <FileDown size={15} strokeWidth={1.75} />
        Exporter PDF
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base" style={{ color: '#0D2B4E' }}>Exporter les travaux</h2>
              <button onClick={() => setOpen(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">De</label>
                <div className="grid grid-cols-2 gap-2">
                  <select value={fromMonth} onChange={e => setFromMonth(parseInt(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
                    {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <input type="number" value={fromYear} onChange={e => setFromYear(parseInt(e.target.value))}
                    min="2000" max="2100"
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">À</label>
                <div className="grid grid-cols-2 gap-2">
                  <select value={toMonth} onChange={e => setToMonth(parseInt(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
                    {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <input type="number" value={toYear} onChange={e => setToYear(parseInt(e.target.value))}
                    min="2000" max="2100"
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
                </div>
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button
                onClick={handleExport}
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: '#0D2B4E' }}
              >
                {loading ? <><Loader2 size={15} className="animate-spin" /> Génération…</> : <><FileDown size={15} /> Télécharger</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
