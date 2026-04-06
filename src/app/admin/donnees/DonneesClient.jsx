'use client'
import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { deleteResidentData, deleteActesByPeriod } from '@/app/actions/admin'
import { createClient } from '@/lib/supabase/client'
import { Download, Trash2, AlertTriangle } from 'lucide-react'

export default function DonneesClient({ residents }) {
  const [pdfResident, setPdfResident] = useState('')
  const [deleteResident, setDeleteResident] = useState('')
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [loading, setLoading] = useState('')
  const [msg, setMsg] = useState('')

  async function exportPDF() {
    if (!pdfResident) return
    setLoading('pdf')
    const supabase = createClient()
    const { data: reals } = await supabase
      .from('realisations')
      .select('performed_at, participation_level, status, procedures(name), profiles!enseignant_id(full_name)')
      .eq('resident_id', pdfResident)
      .order('performed_at')

    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const resident = residents.find(r => r.id === pdfResident)
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Logbook — ${resident?.full_name ?? ''}`, 14, 20)
    doc.setFontSize(10)
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28)
    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Geste', 'Niveau', 'Enseignant', 'Statut']],
      body: (reals ?? []).map(r => [
        new Date(r.performed_at).toLocaleDateString('fr-FR'),
        r.procedures?.name ?? '—',
        r.participation_level,
        r.profiles?.full_name ?? '—',
        r.status,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [13, 43, 78] },
    })
    doc.save(`logbook-${resident?.full_name?.replace(/\s+/g, '-') ?? 'export'}.pdf`)
    setLoading('')
  }

  async function exportCSV() {
    setLoading('csv')
    const supabase = createClient()
    const { data: reals } = await supabase
      .from('realisations')
      .select('performed_at, participation_level, status, resident_year_at_time, is_hors_objectifs, profiles!resident_id(full_name), procedures(name), profiles!enseignant_id(full_name)')
      .order('performed_at')

    const header = ['Date', 'Résident', 'Geste', 'Niveau', 'Enseignant', 'Statut', 'Année résidanat', 'Hors objectifs']
    const rows = (reals ?? []).map(r => [
      new Date(r.performed_at).toLocaleDateString('fr-FR'),
      r['profiles!resident_id']?.full_name ?? '—',
      r.procedures?.name ?? '—',
      r.participation_level,
      r['profiles!enseignant_id']?.full_name ?? '—',
      r.status,
      r.resident_year_at_time,
      r.is_hors_objectifs ? 'Oui' : 'Non',
    ])
    const csv = [header, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'actes-export.csv'; a.click()
    URL.revokeObjectURL(url)
    setLoading('')
  }

  async function handleDeleteResident() {
    if (!deleteResident || !confirm('Supprimer tous les actes de ce résident ?')) return
    setLoading('delRes')
    await deleteResidentData(deleteResident)
    setLoading(''); setMsg('Actes supprimés.')
  }

  async function handleDeletePeriod() {
    if (!confirm('Supprimer les actes de cette période ?')) return
    setLoading('delPeriod')
    await deleteActesByPeriod({ from: periodFrom || undefined, to: periodTo || undefined })
    setLoading(''); setMsg('Actes supprimés.')
  }

  return (
    <>
      <PageHeader title="Données & Exports" subtitle="Export et suppression des données" />
      {msg && <div className="mb-4 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2.5">{msg}</div>}

      <div className="space-y-4">
        {/* Export PDF */}
        <Section title="Export PDF — Logbook résident" icon={<Download size={18} />}>
          <div className="flex gap-3 flex-col sm:flex-row">
            <select value={pdfResident} onChange={e => setPdfResident(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
              <option value="">Choisir un résident…</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
            </select>
            <button onClick={exportPDF} disabled={!pdfResident || loading === 'pdf'}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: '#0D2B4E' }}>
              {loading === 'pdf' ? 'Génération…' : 'Exporter PDF'}
            </button>
          </div>
        </Section>

        {/* Export CSV */}
        <Section title="Export CSV — Tous les actes" icon={<Download size={18} />}>
          <button onClick={exportCSV} disabled={loading === 'csv'}
            className="px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: '#0D2B4E' }}>
            {loading === 'csv' ? 'Génération…' : 'Télécharger CSV'}
          </button>
        </Section>

        {/* Supprimer actes d'un résident */}
        <Section title="Supprimer les actes d'un résident" danger>
          <div className="flex gap-3 flex-col sm:flex-row">
            <select value={deleteResident} onChange={e => setDeleteResident(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
              <option value="">Choisir un résident…</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
            </select>
            <button onClick={handleDeleteResident} disabled={!deleteResident || loading === 'delRes'}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium bg-red-600 disabled:opacity-60">
              {loading === 'delRes' ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </Section>

        {/* Supprimer par période */}
        <Section title="Supprimer les actes par période" danger>
          <div className="flex gap-3 flex-col sm:flex-row items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Du</label>
              <input type="date" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Au</label>
              <input type="date" value={periodTo} onChange={e => setPeriodTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" />
            </div>
            <button onClick={handleDeletePeriod} disabled={loading === 'delPeriod'}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium bg-red-600 disabled:opacity-60">
              {loading === 'delPeriod' ? '…' : 'Supprimer'}
            </button>
          </div>
        </Section>
      </div>
    </>
  )
}

function Section({ title, icon, danger, children }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border ${danger ? 'border-red-100' : 'border-slate-100'}`}>
      <div className="flex items-center gap-2 mb-4">
        {danger ? <AlertTriangle size={18} className="text-red-500" /> : icon}
        <h3 className="font-semibold text-sm" style={{ color: danger ? '#991b1b' : '#0D2B4E' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}
