'use client'
import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'

const LEVELS = { 1: 'Observation', 2: 'Aide opératoire', 3: 'Sous supervision', 4: 'Autonome' }
const STATUS_LABELS = { pending: 'En attente', validated: 'Validé', refused: 'Refusé' }
const TRAVAIL_STATUS = { soumis: 'Soumis', accepte: 'Accepté', publie: 'Publié', presente: 'Présenté' }

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ExportFicheButton({ resident, realisations, travaux, stats, year }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const navy = [13, 43, 78]
    const lightBlue = [232, 244, 252]
    const pageW = doc.internal.pageSize.getWidth()

    // ── En-tête ──
    doc.setFillColor(...navy)
    doc.rect(0, 0, pageW, 32, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Logbook Chirurgie Pédiatrique', 14, 11)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Fiche individuelle résident', 14, 18)
    doc.text(`Exportée le ${fmtDate(new Date().toISOString())}`, 14, 24)

    // ── Identité résident ──
    doc.setFillColor(...lightBlue)
    doc.rect(14, 36, pageW - 28, 22, 'F')
    doc.setTextColor(...navy)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(resident.full_name ?? '—', 20, 45)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(`Année ${year} de résidanat · Promotion ${resident.promotion ?? '—'}`, 20, 52)

    // ── Stats ──
    const statItems = [
      { label: 'Total', value: stats.total },
      { label: 'Validés', value: stats.validated },
      { label: 'En attente', value: stats.pending },
      { label: 'Refusés', value: stats.refused },
      { label: 'Travaux', value: travaux.length },
    ]
    const boxW = (pageW - 28) / statItems.length
    statItems.forEach((s, i) => {
      const x = 14 + i * boxW
      doc.setFillColor(248, 250, 252)
      doc.rect(x, 62, boxW - 2, 16, 'F')
      doc.setTextColor(...navy)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text(String(s.value), x + boxW / 2 - 1, 72, { align: 'center' })
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139)
      doc.text(s.label, x + boxW / 2 - 1, 76, { align: 'center' })
    })

    // ── Gestes réalisés ──
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...navy)
    doc.text(`Gestes réalisés (${realisations.length})`, 14, 88)

    autoTable(doc, {
      startY: 91,
      head: [['Date', 'Geste', 'Niveau', 'Statut', 'Enseignant']],
      body: realisations.map(r => [
        fmtDate(r.performed_at),
        r.procedures?.name ?? '—',
        LEVELS[r.participation_level] ?? '—',
        STATUS_LABELS[r.status] ?? r.status,
        r.profiles?.full_name ?? '—',
      ]),
      headStyles: { fillColor: navy, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [50,50,50] },
      alternateRowStyles: { fillColor: [245,248,252] },
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

    // ── Travaux scientifiques ──
    if (travaux.length > 0) {
      const afterGestes = doc.lastAutoTable.finalY + 8
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...navy)
      doc.text(`Travaux scientifiques (${travaux.length})`, 14, afterGestes)

      autoTable(doc, {
        startY: afterGestes + 3,
        head: [['Titre', 'Type', 'Statut', 'Journal / Congrès', 'Année']],
        body: travaux.map(t => [
          t.title ?? '—',
          t.travail_types?.name ?? '—',
          TRAVAIL_STATUS[t.status] ?? t.status,
          t.journal_or_event ?? '—',
          String(t.year),
        ]),
        headStyles: { fillColor: navy, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [50,50,50] },
        alternateRowStyles: { fillColor: [245,248,252] },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 28 },
          2: { cellWidth: 24 },
          3: { cellWidth: 52 },
          4: { cellWidth: 18 },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (d) => {
          doc.setFontSize(7)
          doc.setTextColor(150)
          doc.text(`Page ${d.pageNumber} / ${doc.internal.getNumberOfPages()}`, pageW / 2, 290, { align: 'center' })
        },
      })
    }

    doc.save(`fiche_${resident.full_name?.replace(/\s+/g, '_') ?? 'resident'}.pdf`)
    setLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60"
      style={{ color: '#0D2B4E' }}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} strokeWidth={1.75} />}
      Exporter fiche PDF
    </button>
  )
}
