'use client'
import { useState } from 'react'
import { FileDown, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

export default function ExportGestesButton({ residentName }) {
  const today = new Date().toISOString().slice(0, 10)
  const firstOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)

  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(firstOfYear)
  const [to, setTo] = useState(today)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleExport() {
    if (!from || !to) { setError('Veuillez selectionner les deux dates.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('realisations')
      .select('performed_at, activity_type, status, ipp_patient, procedures(name), profiles!enseignant_id(full_name)')
      .gte('performed_at', from)
      .lte('performed_at', `${to}T23:59:59`)
      .order('performed_at', { ascending: false })

    setLoading(false)
    if (err) { setError('Erreur lors du chargement des donnees.'); return }
    if (!data || data.length === 0) { setError('Aucun geste trouve pour cette periode.'); return }

    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const navy = [13, 43, 78]
    const pageW = doc.internal.pageSize.getWidth()

    doc.setFillColor(...navy)
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Logbook Chirurgie Pediatrique', 14, 11)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Recapitulatif des gestes realises', 14, 18)
    doc.text(`du ${fmtDateLong(from)} au ${fmtDateLong(to)}`, 14, 24)

    doc.setTextColor(40, 40, 40)
    doc.setFontSize(9)
    if (residentName) {
      doc.text(`Resident : ${residentName}`, 14, 36)
    }
    doc.text(`Exporte le ${fmtDate(today)}`, 14, residentName ? 41 : 36)

    autoTable(doc, {
      startY: residentName ? 46 : 41,
      head: [['Date', 'Geste', 'Type', 'Statut', 'Enseignant']],
      body: data.map((realisation) => [
        fmtDate(realisation.performed_at),
        realisation.procedures?.name ?? '—',
        ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '—',
        STATUS_LABELS[realisation.status] ?? realisation.status,
        realisation.profiles?.full_name ?? '—',
      ]),
      headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 60 },
        2: { cellWidth: 35 },
        3: { cellWidth: 24 },
        4: { cellWidth: 40 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (tableData) => {
        const pageCount = doc.internal.getNumberOfPages()
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`Page ${tableData.pageNumber} / ${pageCount}`, pageW / 2, 290, { align: 'center' })
      },
    })

    doc.save(`gestes_${from}_${to}.pdf`)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError('') }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50"
        style={{ color: '#0D2B4E' }}
      >
        <FileDown size={15} strokeWidth={1.75} />
        Exporter PDF
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base" style={{ color: '#0D2B4E' }}>Exporter les gestes</h2>
              <button onClick={() => setOpen(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Du</label>
                <input type="date" value={from} onChange={(event) => setFrom(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Au</label>
                <input type="date" value={to} onChange={(event) => setTo(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button
                onClick={handleExport}
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: '#0D2B4E' }}
              >
                {loading ? <><Loader2 size={15} className="animate-spin" /> Generation...</> : <><FileDown size={15} /> Telecharger</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
