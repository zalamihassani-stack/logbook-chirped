'use client'
import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { createProcedure, updateProcedure, deleteProcedure, createCategory, updateCategory, deleteCategory } from '@/app/actions/admin'
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'

const YEARS = [1, 2, 3, 4, 5]
const LEVELS = { 0: 'Non requis', 1: 'Observation', 2: 'Aide opératoire', 3: 'Sous supervision', 4: 'Autonome' }

function emptyObjectives() {
  return YEARS.map(y => ({ year: y, required_level: 0, min_count: 1 }))
}

export default function GestesManagement({ initialProcedures, initialCategories }) {
  const [procedures, setProcedures] = useState(initialProcedures)
  const [categories, setCategories] = useState(initialCategories)
  const [tab, setTab] = useState('gestes') // 'gestes' | 'categories'
  const [filterCat, setFilterCat] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ procedure_code: '', name: '', category_id: '', pathologie: '', objectives: emptyObjectives() })
  const [catModal, setCatModal] = useState(null)
  const [catForm, setCatForm] = useState({ name: '', color_hex: '#0D2B4E', display_order: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  function openCreate() {
    setForm({ procedure_code: '', name: '', category_id: categories[0]?.id ?? '', pathologie: '', objectives: emptyObjectives() })
    setError('')
    setModal('create')
  }
  function openEdit(p) {
    const filled = emptyObjectives().map(o => {
      const existing = p.procedure_objectives?.find(e => e.year === o.year)
      return existing ? { year: o.year, required_level: existing.required_level, min_count: existing.min_count } : o
    })
    setForm({ procedure_code: p.procedure_code ?? '', name: p.name, category_id: p.category_id, pathologie: p.pathologie ?? '', objectives: filled })
    setError(''); setModal(p)
  }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const objectives = form.objectives.map(o => ({ ...o, required_level: parseInt(o.required_level) }))
    const payload = { ...form, objectives }
    const res = modal === 'create' ? await createProcedure(payload) : await updateProcedure(modal.id, payload)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    window.location.reload()
  }

  async function handleDelete(id) {
    setLoading(true)
    await deleteProcedure(id)
    setLoading(false)
    setConfirmDelete(null)
    setProcedures(prev => prev.filter(p => p.id !== id))
  }

  async function handleCatSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const res = catModal === 'create' ? await createCategory(catForm) : await updateCategory(catModal.id, catForm)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    window.location.reload()
  }

  const filtered = filterCat ? procedures.filter(p => p.category_id === filterCat) : procedures

  return (
    <>
      <PageHeader title="Gestes & Objectifs" subtitle="Référentiel des procédures" action={
        <button onClick={tab === 'gestes' ? openCreate : () => { setCatForm({ name: '', color_hex: '#0D2B4E', display_order: 0 }); setCatModal('create') }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ backgroundColor: '#0D2B4E' }}>
          <Plus size={16} /> {tab === 'gestes' ? 'Nouveau geste' : 'Nouvelle catégorie'}
        </button>
      } />

      <div className="flex gap-2 mb-4">
        {['gestes', 'categories'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-sm font-medium capitalize transition"
            style={tab === t ? { backgroundColor: '#0D2B4E', color: 'white' } : { backgroundColor: 'white', color: '#0D2B4E', border: '1px solid #e2e8f0' }}>
            {t === 'gestes' ? 'Gestes' : 'Catégories'}
          </button>
        ))}
      </div>

      {tab === 'gestes' && (
        <>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="mb-4 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
            <option value="">Toutes les catégories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="space-y-2">
            {filtered.map(p => {
              const cat = categories.find(c => c.id === p.category_id)
              const hasObj = p.procedure_objectives?.filter(o => o.required_level > 0)
              return (
                <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                        {cat && <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: cat.color_hex + '25', color: cat.color_hex }}>{cat.name}</span>}
                      </div>
                      {p.pathologie && <p className="text-xs text-slate-500 mt-0.5">{p.pathologie}</p>}
                      {hasObj?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {hasObj.map(o => (
                            <span key={o.year} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              A{o.year}: {LEVELS[o.required_level]} ×{o.min_count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-slate-100"><Pencil size={15} className="text-slate-500" /></button>
                      <button onClick={() => setConfirmDelete(p)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 size={15} className="text-red-500" /></button>
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <p className="text-center text-sm text-slate-400 py-8">Aucun geste</p>}
          </div>
        </>
      )}

      {tab === 'categories' && (
        <div className="space-y-2">
          {categories.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: c.color_hex }} />
              <span className="flex-1 text-sm font-medium text-slate-800">{c.name}</span>
              <div className="flex gap-2">
                <button onClick={() => { setCatForm({ name: c.name, color_hex: c.color_hex, display_order: c.display_order ?? 0 }); setCatModal(c) }}
                  className="p-2 rounded-lg hover:bg-slate-100"><Pencil size={15} className="text-slate-500" /></button>
                <button onClick={async () => { if (confirm('Supprimer cette catégorie ?')) { await deleteCategory(c.id); setCategories(prev => prev.filter(x => x.id !== c.id)) } }}
                  className="p-2 rounded-lg hover:bg-red-50"><Trash2 size={15} className="text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal geste */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg" style={{ color: '#0D2B4E' }}>{modal === 'create' ? 'Nouveau geste' : 'Modifier'}</h2>
              <button onClick={() => setModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Code procédure" value={form.procedure_code} onChange={v => setForm(f => ({ ...f, procedure_code: v }))} />
              <Field label="Nom du geste" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Catégorie</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Field label="Pathologie" value={form.pathologie} onChange={v => setForm(f => ({ ...f, pathologie: v }))} />
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: '#0D2B4E' }}>Objectifs par année</p>
                <div className="space-y-2">
                  {form.objectives.map((o, i) => (
                    <div key={o.year} className="flex items-center gap-2 text-sm">
                      <span className="w-8 font-medium text-slate-600">A{o.year}</span>
                      <select value={o.required_level}
                        onChange={e => setForm(f => { const obj = [...f.objectives]; obj[i] = { ...obj[i], required_level: e.target.value }; return { ...f, objectives: obj } })}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm outline-none">
                        {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <input type="number" min="1" max="50" value={o.min_count}
                        onChange={e => setForm(f => { const obj = [...f.objectives]; obj[i] = { ...obj[i], min_count: e.target.value }; return { ...f, objectives: obj } })}
                        className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-sm outline-none text-center"
                        disabled={parseInt(o.required_level) === 0} placeholder="min" />
                    </div>
                  ))}
                </div>
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

      {/* Modal catégorie */}
      {catModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg" style={{ color: '#0D2B4E' }}>{catModal === 'create' ? 'Nouvelle catégorie' : 'Modifier'}</h2>
              <button onClick={() => setCatModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCatSubmit} className="space-y-4">
              <Field label="Nom" value={catForm.name} onChange={v => setCatForm(f => ({ ...f, name: v }))} required />
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Couleur</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={catForm.color_hex} onChange={e => setCatForm(f => ({ ...f, color_hex: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                  <span className="text-sm text-slate-600">{catForm.color_hex}</span>
                </div>
              </div>
              <Field label="Ordre d'affichage" type="number" value={catForm.display_order} onChange={v => setCatForm(f => ({ ...f, display_order: v }))} />
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-60"
                style={{ backgroundColor: '#0D2B4E' }}>
                {loading ? '…' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation suppression geste */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="font-semibold text-slate-800 mb-2">Désactiver « {confirmDelete.name} » ?</p>
            <p className="text-sm text-slate-500 mb-5">Le geste sera masqué du référentiel.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm">Annuler</button>
              <button onClick={() => handleDelete(confirmDelete.id)} disabled={loading}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium disabled:opacity-60">
                {loading ? '…' : 'Désactiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400 transition" />
    </div>
  )
}
