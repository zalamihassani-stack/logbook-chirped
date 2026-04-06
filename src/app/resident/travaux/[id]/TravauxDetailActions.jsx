'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, X } from 'lucide-react'
import { updateTravail, deleteTravail } from '@/app/actions/resident'

const STATUS_OPTIONS = [
  { value: 'soumis', label: 'Soumis' },
  { value: 'accepte', label: 'Accepté' },
  { value: 'publie', label: 'Publié' },
  { value: 'presente', label: 'Présenté' },
]

export default function TravauxDetailActions({ travail, types }) {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    title: travail.title,
    type_id: travail.type_id,
    journal_or_event: travail.journal_or_event ?? '',
    year: travail.year,
    authors: travail.authors ?? '',
    doi_or_url: travail.doi_or_url ?? '',
    status: travail.status,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const res = await updateTravail(travail.id, form)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setModal(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce travail ?')) return
    setLoading(true)
    await deleteTravail(travail.id)
    router.push('/resident/travaux')
  }

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50"
          style={{ color: '#0D2B4E' }}
        >
          <Pencil size={15} strokeWidth={1.75} />
          Modifier
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-red-100 bg-red-50 hover:bg-red-100 text-red-600"
        >
          <Trash2 size={15} strokeWidth={1.75} />
          Supprimer
        </button>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg" style={{ color: '#0D2B4E' }}>Modifier</h2>
              <button onClick={() => setModal(false)}><X size={20} className="text-slate-400" /></button>
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
