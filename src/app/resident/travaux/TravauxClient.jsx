'use client'
import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { createTravail, updateTravail, deleteTravail } from '@/app/actions/resident'
import { Plus, Pencil, Trash2, X, ExternalLink } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'soumis', label: 'Soumis' },
  { value: 'accepte', label: 'Accepté' },
  { value: 'publie', label: 'Publié' },
]

const EMPTY = { title: '', type_id: '', journal_or_event: '', year: new Date().getFullYear(), authors: '', doi_or_url: '', status: 'soumis' }

export default function TravauxClient({ initialTravaux, types }) {
  const [travaux, setTravaux] = useState(initialTravaux)
  const [tabType, setTabType] = useState('all')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtered = tabType === 'all' ? travaux : travaux.filter(t => t.type_id === tabType)

  function openCreate() { setForm({ ...EMPTY, type_id: types[0]?.id ?? '' }); setError(''); setModal('create') }
  function openEdit(t) { setForm({ title: t.title, type_id: t.type_id, journal_or_event: t.journal_or_event ?? '', year: t.year, authors: t.authors ?? '', doi_or_url: t.doi_or_url ?? '', status: t.status }); setError(''); setModal(t) }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const res = modal === 'create' ? await createTravail(form) : await updateTravail(modal.id, form)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    window.location.reload()
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce travail ?')) return
    setLoading(true)
    await deleteTravail(id)
    setTravaux(prev => prev.filter(t => t.id !== id))
    setLoading(false)
  }

  return (
    <>
      <PageHeader title="Travaux scientifiques" subtitle={`${travaux.length} travail(x)`} action={
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ backgroundColor: '#0D2B4E' }}>
          <Plus size={16} /> Ajouter
        </button>
      } />

      {/* Tabs par type */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setTabType('all')}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition"
          style={tabType === 'all' ? { backgroundColor: '#0D2B4E', color: 'white' } : { backgroundColor: 'white', color: '#0D2B4E', border: '1px solid #e2e8f0' }}>
          Tous
        </button>
        {types.map(t => (
          <button key={t.id} onClick={() => setTabType(t.id)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition"
            style={tabType === t.id
              ? { backgroundColor: t.color_hex, color: 'white' }
              : { backgroundColor: t.color_hex + '20', color: t.color_hex, border: `1px solid ${t.color_hex}40` }}>
            {t.name}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(t => (
          <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{t.title}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {t.travail_types && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: t.travail_types.color_hex + '25', color: t.travail_types.color_hex }}>
                      {t.travail_types.name}
                    </span>
                  )}
                  <Badge status={t.status} />
                  <span className="text-xs text-slate-500">{t.year}</span>
                </div>
                {t.journal_or_event && <p className="text-xs text-slate-500 mt-1">{t.journal_or_event}</p>}
                {t.authors && <p className="text-xs text-slate-400 mt-0.5">{t.authors}</p>}
                {t.doi_or_url && (
                  <a href={t.doi_or_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 mt-1" style={{ color: '#7BB8E8' }}>
                    <ExternalLink size={11} /> Lien
                  </a>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-slate-100"><Pencil size={15} className="text-slate-500" /></button>
                <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 size={15} className="text-red-500" /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-slate-400 py-8">Aucun travail enregistré</p>}
      </div>

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg" style={{ color: '#0D2B4E' }}>{modal === 'create' ? 'Ajouter un travail' : 'Modifier'}</h2>
              <button onClick={() => setModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Titre *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Type *</label>
                <select value={form.type_id} onChange={e => setForm(f => ({ ...f, type_id: e.target.value }))} required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
                  {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Journal / Congrès</label>
                <input type="text" value={form.journal_or_event} onChange={e => setForm(f => ({ ...f, journal_or_event: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Année</label>
                  <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}
                    min="2000" max="2100"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Statut</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Auteurs</label>
                <input type="text" value={form.authors} onChange={e => setForm(f => ({ ...f, authors: e.target.value }))}
                  placeholder="Nom1, Nom2…"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>DOI / URL</label>
                <input type="text" value={form.doi_or_url} onChange={e => setForm(f => ({ ...f, doi_or_url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-60"
                style={{ backgroundColor: '#0D2B4E' }}>
                {loading ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
