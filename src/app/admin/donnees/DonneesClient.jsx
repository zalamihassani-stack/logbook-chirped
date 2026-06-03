'use client'
import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import AppModal from '@/components/ui/AppModal'
import { deleteResidentData, deleteActesByPeriod, previewDeleteResidentData, previewDeleteActesByPeriod } from '@/app/actions/admin'
import { createClient } from '@/lib/supabase/client'
import { ACTIVITY_TYPE_LABELS } from '@/lib/logbook'
import { Download, AlertTriangle } from 'lucide-react'

export default function DonneesClient({ residents }) {
  const [pdfResident, setPdfResident] = useState('')
  const [deleteResident, setDeleteResident] = useState('')
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [loading, setLoading] = useState('')
  const [msg, setMsg] = useState(null)
  const [confirm, setConfirm] = useState(null)

  async function exportPDF() {
    if (!pdfResident) return
    setLoading('pdf')
    setMsg(null)
    const supabase = createClient()
    const { data: reals, error } = await supabase
      .from('realisations')
      .select('performed_at, activity_type, status, procedures(name), profiles!enseignant_id(full_name)')
      .eq('resident_id', pdfResident)
      .order('performed_at')
    if (error) {
      setLoading('')
      setMsg({ type: 'error', text: error.message })
      return
    }

    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const resident = residents.find((item) => item.id === pdfResident)
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Logbook - ${resident?.full_name ?? ''}`, 14, 20)
    doc.setFontSize(10)
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28)
    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Geste', 'Type', 'Enseignant', 'Statut']],
      body: (reals ?? []).map((realisation) => [
        new Date(realisation.performed_at).toLocaleDateString('fr-FR'),
        realisation.procedures?.name ?? '-',
        ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '-',
        realisation.profiles?.full_name ?? '-',
        realisation.status,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [13, 43, 78] },
    })
    doc.save(`logbook-${resident?.full_name?.replace(/\s+/g, '-') ?? 'export'}.pdf`)
    setLoading('')
  }

  async function exportCSV() {
    setLoading('csv')
    setMsg(null)
    const supabase = createClient()
    const { data: reals, error } = await supabase
      .from('realisations')
      .select('performed_at, activity_type, status, resident_year_at_time, is_hors_objectifs, resident:profiles!resident_id(full_name), procedures(name), enseignant:profiles!enseignant_id(full_name)')
      .order('performed_at')
    if (error) {
      setLoading('')
      setMsg({ type: 'error', text: error.message })
      return
    }

    const header = ['Date', 'Résident', 'Geste', 'Type', 'Enseignant', 'Statut', 'Année résidanat', 'Hors objectifs']
    const rows = (reals ?? []).map((realisation) => [
      new Date(realisation.performed_at).toLocaleDateString('fr-FR'),
      realisation.resident?.full_name ?? '-',
      realisation.procedures?.name ?? '-',
      ACTIVITY_TYPE_LABELS[realisation.activity_type] ?? '-',
      realisation.enseignant?.full_name ?? '-',
      realisation.status,
      realisation.resident_year_at_time,
      realisation.is_hors_objectifs ? 'Oui' : 'Non',
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'actes-export.csv'
    link.click()
    URL.revokeObjectURL(url)
    setLoading('')
  }

  async function openDeleteResidentPreview() {
    if (!deleteResident) return
    setLoading('preview')
    setMsg(null)
    const res = await previewDeleteResidentData({ residentId: deleteResident })
    setLoading('')
    if (res.error) {
      setMsg({ type: 'error', text: res.error })
      return
    }
    const resident = residents.find((item) => item.id === deleteResident)
    setConfirm({ type: 'resident', count: res.count ?? 0, resident })
  }

  async function openDeletePeriodPreview() {
    if (!periodFrom || !periodTo) {
      setMsg({ type: 'error', text: 'Indiquez une date de debut et une date de fin.' })
      return
    }
    setLoading('preview')
    setMsg(null)
    const res = await previewDeleteActesByPeriod({ from: periodFrom, to: periodTo })
    setLoading('')
    if (res.error) {
      setMsg({ type: 'error', text: res.error })
      return
    }
    setConfirm({ type: 'period', count: res.count ?? 0, from: periodFrom, to: periodTo })
  }

  async function confirmDelete() {
    if (!confirm) return
    setLoading(confirm.type === 'resident' ? 'delRes' : 'delPeriod')
    const res = confirm.type === 'resident'
      ? await deleteResidentData({ residentId: deleteResident, confirmationToken: 'SUPPRIMER' })
      : await deleteActesByPeriod({ from: periodFrom, to: periodTo, confirmationToken: 'SUPPRIMER' })
    setLoading('')
    setConfirm(null)
    setMsg(res.error ? { type: 'error', text: res.error } : { type: 'success', text: `${res.deletedCount ?? 0} acte(s) supprime(s).` })
  }

  return (
    <>
      <PageHeader title="Données & Exports" />
      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="space-y-4">
        <Section title="Export PDF - Logbook résident" icon={<Download size={18} />}>
          <div className="flex gap-3 flex-col sm:flex-row">
            <select value={pdfResident} onChange={(event) => setPdfResident(event.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
              <option value="">Choisir un résident...</option>
              {residents.map((resident) => <option key={resident.id} value={resident.id}>{resident.full_name}</option>)}
            </select>
            <button onClick={exportPDF} disabled={!pdfResident || loading === 'pdf'}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-navy)' }}>
              {loading === 'pdf' ? 'Génération...' : 'Exporter PDF'}
            </button>
          </div>
        </Section>

        <Section title="Export CSV - Tous les actes" icon={<Download size={18} />}>
          <button onClick={exportCSV} disabled={loading === 'csv'}
            className="px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-navy)' }}>
            {loading === 'csv' ? 'Génération...' : 'Télécharger CSV'}
          </button>
        </Section>

        <Section title="Supprimer les actes d'un résident" danger>
          <div className="flex gap-3 flex-col sm:flex-row">
            <select value={deleteResident} onChange={(event) => setDeleteResident(event.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
              <option value="">Choisir un résident...</option>
              {residents.map((resident) => <option key={resident.id} value={resident.id}>{resident.full_name}</option>)}
            </select>
            <button onClick={openDeleteResidentPreview} disabled={!deleteResident || loading === 'delRes' || loading === 'preview'}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium bg-red-600 disabled:opacity-60">
              {loading === 'preview' ? 'Analyse...' : loading === 'delRes' ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </Section>

        <Section title="Supprimer les actes par période" danger>
          <div className="flex gap-3 flex-col sm:flex-row items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Du</label>
              <input type="date" value={periodFrom} onChange={(event) => setPeriodFrom(event.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Au</label>
              <input type="date" value={periodTo} onChange={(event) => setPeriodTo(event.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" />
            </div>
            <button onClick={openDeletePeriodPreview} disabled={!periodFrom || !periodTo || loading === 'delPeriod' || loading === 'preview'}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium bg-red-600 disabled:opacity-60">
              {loading === 'preview' ? 'Analyse...' : loading === 'delPeriod' ? '...' : 'Supprimer'}
            </button>
          </div>
        </Section>
      </div>

      {confirm && (
        <AppModal
          title="Confirmer la suppression"
          subtitle={`${confirm.count} acte(s) seront supprimé(s).`}
          onClose={() => setConfirm(null)}
          maxWidth="max-w-sm"
        >
          <div className="space-y-4">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {confirm.type === 'resident'
                ? `Résident : ${confirm.resident?.full_name ?? '-'}`
                : `Période : ${confirm.from} au ${confirm.to}`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm">Annuler</button>
              <button onClick={confirmDelete} disabled={loading === 'delRes' || loading === 'delPeriod' || confirm.count === 0}
                className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white disabled:opacity-60">
                {loading ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </AppModal>
      )}
    </>
  )
}

function Section({ title, icon, danger, children }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border ${danger ? 'border-red-100' : 'border-slate-100'}`}>
      <div className="flex items-center gap-2 mb-4">
        {danger ? <AlertTriangle size={18} className="text-red-500" /> : icon}
        <h3 className="font-semibold text-sm" style={{ color: danger ? 'var(--color-danger)' : 'var(--color-navy)' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}
