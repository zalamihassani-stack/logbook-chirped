'use client'
import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { createProcedure, updateProcedure, deleteProcedure, createCategory, updateCategory, deleteCategory } from '@/app/actions/admin'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const YEARS = [1, 2, 3, 4, 5]
const LEVELS = { 0: 'Non requis', 1: 'Exposition', 2: 'Sous supervision', 3: 'Autonomie' }
const AUTONOMY_OBJECTIVE_LEVELS = { 0: 'Non affichÃ©', 3: 'Objectif autonomie' }

function emptyObjectives() {
  return YEARS.map((year) => ({ year, required_level: 0, min_count: 1 }))
}
function emptyProcedureForm(categoryId = '') {
  return {
    procedure_code: '',
    name: '',
    category_id: categoryId,
    pathologie: '',
    objectif_final: 3,
    seuil_exposition_min: 0,
    seuil_supervision_min: 0,
    seuil_autonomie_min: 0,
    seuil_deblocage_autonomie: 0,
    objectives: emptyObjectives(),
  }
}

export default function GestesManagement({ initialProcedures, initialCategories }) {
  const [procedures, setProcedures] = useState(initialProcedures)
  const [categories, setCategories] = useState(initialCategories)
  const [tab, setTab] = useState('gestes')
  const [filterCat, setFilterCat] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyProcedureForm(initialCategories[0]?.id ?? ''))
  const [catModal, setCatModal] = useState(null)
  const [catForm, setCatForm] = useState({ name: '', color_hex: '#0D2B4E', display_order: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  function openCreate() {
    setForm(emptyProcedureForm(categories[0]?.id ?? ''))
    setError('')
    setModal('create')
  }

  function openEdit(procedure) {
    const filled = emptyObjectives().map((objective) => {
      const existing = procedure.procedure_objectives?.find((item) => item.year === objective.year)
      return existing
        ? { year: objective.year, required_level: existing.required_level, min_count: existing.min_count ?? 1 }
        : objective
    })
    setForm({
      procedure_code: procedure.procedure_code ?? '',
      name: procedure.name,
      category_id: procedure.category_id,
      pathologie: procedure.pathologie ?? '',
      objectif_final: procedure.objectif_final ?? 1,
      seuil_exposition_min: procedure.seuil_exposition_min ?? 0,
      seuil_supervision_min: procedure.seuil_supervision_min ?? 0,
      seuil_autonomie_min: procedure.seuil_autonomie_min ?? 0,
      seuil_deblocage_autonomie: procedure.seuil_deblocage_autonomie ?? 0,
      objectives: filled,
    })
    setError('')
    setModal(procedure)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      ...form,
      procedure_code: form.procedure_code ? Number.parseInt(form.procedure_code, 10) : null,
      objectif_final: Number.parseInt(form.objectif_final, 10),
      seuil_exposition_min: Number.parseInt(form.seuil_exposition_min, 10) || 0,
      seuil_supervision_min: Number.parseInt(form.seuil_supervision_min, 10) || 0,
      seuil_autonomie_min: Number.parseInt(form.seuil_autonomie_min, 10) || 0,
      seuil_deblocage_autonomie: Number.parseInt(form.seuil_deblocage_autonomie, 10) || 0,
      objectives: form.objectives.map((objective) => ({
        ...objective,
        required_level: Number.parseInt(objective.required_level, 10),
        min_count: Number.parseInt(objective.min_count, 10) || 1,
      })),
    }

    const res = modal === 'create' ? await createProcedure(payload) : await updateProcedure(modal.id, payload)

    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }

    window.location.reload()
  }

  async function handleDelete(id) {
    setLoading(true)
    await deleteProcedure(id)
    setLoading(false)
    setConfirmDelete(null)
    setProcedures((current) => current.filter((procedure) => procedure.id !== id))
  }

  async function handleCatSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const res = catModal === 'create' ? await createCategory(catForm) : await updateCategory(catModal.id, catForm)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    window.location.reload()
  }

  const filtered = filterCat ? procedures.filter((procedure) => procedure.category_id === filterCat) : procedures

  return (
    <>
      <PageHeader
        title="Gestes & Objectifs"
        subtitle="Referentiel des procedures"
        action={
          <button
            onClick={tab === 'gestes' ? openCreate : () => { setCatForm({ name: '', color_hex: '#0D2B4E', display_order: 0 }); setCatModal('create') }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#0D2B4E' }}
          >
            <Plus size={16} /> {tab === 'gestes' ? 'Nouveau geste' : 'Nouvelle categorie'}
          </button>
        }
      />

      <div className="mb-4 flex gap-2">
        {['gestes', 'categories'].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className="rounded-full px-4 py-1.5 text-sm font-medium capitalize transition"
            style={tab === item ? { backgroundColor: '#0D2B4E', color: 'white' } : { backgroundColor: 'white', color: '#0D2B4E', border: '1px solid #e2e8f0' }}
          >
            {item === 'gestes' ? 'Gestes' : 'Categories'}
          </button>
        ))}
      </div>

      {tab === 'gestes' && (
        <>
          <select
            value={filterCat}
            onChange={(event) => setFilterCat(event.target.value)}
            className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="">Toutes les categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <div className="space-y-2">
            {filtered.map((procedure) => {
              const category = categories.find((item) => item.id === procedure.category_id)
              const hasObjectives = procedure.procedure_objectives?.filter((objective) => objective.required_level === 3)
              return (
                <div key={procedure.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{procedure.name}</span>
                        {category && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: `${category.color_hex}25`, color: category.color_hex }}
                          >
                            {category.name}
                          </span>
                        )}
                      </div>
                      {procedure.pathologie && <p className="mt-0.5 text-xs text-slate-500">{procedure.pathologie}</p>}
                      <p className="mt-2 text-xs text-slate-500">
                        Objectif final: {LEVELS[procedure.objectif_final] ?? '-'} Â· Exposition {procedure.seuil_exposition_min ?? 0} Â· Supervision {procedure.seuil_supervision_min ?? 0} Â· Autonomie {procedure.seuil_autonomie_min ?? 0} Â· DÃ©blocage auto {procedure.seuil_deblocage_autonomie ?? 0}
                      </p>
                      {hasObjectives?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {hasObjectives.map((objective) => (
                            <span key={objective.year} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              A{objective.year}: {LEVELS[objective.required_level]} x{objective.min_count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 gap-2">
                      <button onClick={() => openEdit(procedure)} className="rounded-lg p-2 hover:bg-slate-100">
                        <Pencil size={15} className="text-slate-500" />
                      </button>
                      <button onClick={() => setConfirmDelete(procedure)} className="rounded-lg p-2 hover:bg-red-50">
                        <Trash2 size={15} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucun geste</p>}
          </div>
        </>
      )}

      {tab === 'categories' && (
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="h-8 w-8 flex-shrink-0 rounded-lg" style={{ backgroundColor: category.color_hex }} />
              <span className="flex-1 text-sm font-medium text-slate-800">{category.name}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setCatForm({ name: category.name, color_hex: category.color_hex, display_order: category.display_order ?? 0 }); setCatModal(category) }}
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <Pencil size={15} className="text-slate-500" />
                </button>
                <button
                  onClick={async () => { if (confirm('Supprimer cette categorie ?')) { await deleteCategory(category.id); setCategories((current) => current.filter((item) => item.id !== category.id)) } }}
                  className="rounded-lg p-2 hover:bg-red-50"
                >
                  <Trash2 size={15} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#0D2B4E' }}>{modal === 'create' ? 'Nouveau geste' : 'Modifier'}</h2>
              <button onClick={() => setModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Code procedure" type="number" value={form.procedure_code} onChange={(value) => setForm((current) => ({ ...current, procedure_code: value }))} />
              <Field label="Nom du geste" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Categorie</label>
                <select
                  value={form.category_id}
                  onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <Field label="Pathologie" value={form.pathologie} onChange={(value) => setForm((current) => ({ ...current, pathologie: value }))} />
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Objectif final</label>
                <select
                  value={form.objectif_final}
                  onChange={(event) => setForm((current) => ({ ...current, objectif_final: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  {[1, 2, 3].map((level) => <option key={level} value={level}>{LEVELS[level]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Seuil exposition" type="number" value={form.seuil_exposition_min} onChange={(value) => setForm((current) => ({ ...current, seuil_exposition_min: value }))} />
                <Field label="Seuil supervision" type="number" value={form.seuil_supervision_min} onChange={(value) => setForm((current) => ({ ...current, seuil_supervision_min: value }))} />
                <Field label="Seuil autonomie" type="number" value={form.seuil_autonomie_min} onChange={(value) => setForm((current) => ({ ...current, seuil_autonomie_min: value }))} />
                <Field label="Deblocage autonome" type="number" value={form.seuil_deblocage_autonomie} onChange={(value) => setForm((current) => ({ ...current, seuil_deblocage_autonomie: value }))} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium" style={{ color: '#0D2B4E' }}>Objectifs d&apos;autonomie par annÃ©e</p>
                <div className="space-y-2">
                  {form.objectives.map((objective, index) => (
                    <div key={objective.year} className="flex items-center gap-2 text-sm">
                      <span className="w-8 font-medium text-slate-600">A{objective.year}</span>
                      <select
                        value={objective.required_level}
                        onChange={(event) =>
                          setForm((current) => {
                            const next = [...current.objectives]
                            next[index] = { ...next[index], required_level: event.target.value }
                            return { ...current, objectives: next }
                          })
                        }
                        className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none"
                      >
                        {Object.entries(AUTONOMY_OBJECTIVE_LEVELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={objective.min_count}
                        onChange={(event) =>
                          setForm((current) => {
                            const next = [...current.objectives]
                            next[index] = { ...next[index], min_count: event.target.value }
                            return { ...current, objectives: next }
                          })
                        }
                        className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: '#0D2B4E' }}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {catModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#0D2B4E' }}>{catModal === 'create' ? 'Nouvelle categorie' : 'Modifier'}</h2>
              <button onClick={() => setCatModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCatSubmit} className="space-y-4">
              <Field label="Nom" value={catForm.name} onChange={(value) => setCatForm((current) => ({ ...current, name: value }))} required />
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>Couleur</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={catForm.color_hex}
                    onChange={(event) => setCatForm((current) => ({ ...current, color_hex: event.target.value }))}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200"
                  />
                  <span className="text-sm text-slate-600">{catForm.color_hex}</span>
                </div>
              </div>
              <Field label="Ordre d'affichage" type="number" value={catForm.display_order} onChange={(value) => setCatForm((current) => ({ ...current, display_order: value }))} />
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: '#0D2B4E' }}
              >
                {loading ? '...' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <p className="mb-2 font-semibold text-slate-800">Desactiver &quot;{confirmDelete.name}&quot; ?</p>
            <p className="mb-5 text-sm text-slate-500">Le geste sera masque du referentiel.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm">Annuler</button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? '...' : 'Desactiver'}
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
      <label className="mb-1 block text-sm font-medium" style={{ color: '#0D2B4E' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
      />
    </div>
  )
}
