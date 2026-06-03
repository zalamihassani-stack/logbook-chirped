'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import AppCard from '@/components/ui/AppCard'
import AppModal from '@/components/ui/AppModal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import StatusTabs from '@/components/ui/StatusTabs'
import FormField, { TextInput } from '@/components/ui/FormField'
import { createProcedure, updateProcedure, deleteProcedure, createCategory, updateCategory, deleteCategory, importReferentiel } from '@/app/actions/admin'
import { DEFAULT_SERVICE, SERVICE_LABELS, SERVICE_OPTIONS, normalizeService } from '@/lib/logbook'
import { Plus, Pencil, Trash2, FileDown, Upload } from 'lucide-react'

const YEARS = [1, 2, 3, 4, 5]
const DEFAULT_CATEGORY_COLOR = '#0D2B4E'
const LEVELS = { 0: 'Non requis', 1: 'Exposition', 2: 'Sous supervision', 3: 'Autonomie' }
const OBJECTIVE_LEVELS = { 0: 'Non requis', 2: 'Sous supervision', 3: 'Autonomie' }
const TABS = [
  { value: 'gestes', label: 'Gestes' },
  { value: 'categories', label: 'Catégories' },
]

function emptyObjectives() {
  return YEARS.map((year) => ({ year, required_level: 0, min_count: 1 }))
}
function firstCategoryForService(categories, service) {
  return categories.find((category) => normalizeService(category.service) === service)?.id ?? ''
}

function categoriesForService(categories, service) {
  return categories.filter((category) => normalizeService(category.service) === service)
}

function emptyProcedureForm(categories = [], service = DEFAULT_SERVICE) {
  return {
    name: '',
    service,
    category_id: firstCategoryForService(categories, service),
    pathologie: '',
    objectif_final: 3,
    target_level: 3,
    target_count: 3,
    target_year: 2,
    seuil_exposition_min: 0,
    seuil_supervision_min: 0,
    seuil_autonomie_min: 0,
    seuil_deblocage_autonomie: 0,
    objectives: emptyObjectives(),
  }
}

export default function GestesManagement({ initialProcedures, initialCategories }) {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [procedures, setProcedures] = useState(initialProcedures)
  const [categories, setCategories] = useState(initialCategories)
  const [tab, setTab] = useState('gestes')
  const [filterCat, setFilterCat] = useState('')
  const [filterService, setFilterService] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyProcedureForm(initialCategories))
  const [catModal, setCatModal] = useState(null)
  const [catForm, setCatForm] = useState({ name: '', service: DEFAULT_SERVICE, color_hex: DEFAULT_CATEGORY_COLOR, display_order: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmCategoryDelete, setConfirmCategoryDelete] = useState(null)

  useEffect(() => {
    setProcedures(initialProcedures)
  }, [initialProcedures])

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  function openCreate() {
    setForm(emptyProcedureForm(categories))
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
      service: normalizeService(procedure.service),
      pathologie: procedure.pathologie ?? '',
      objectif_final: procedure.objectif_final ?? 1,
      target_level: procedure.target_level ?? procedure.objectif_final ?? 1,
      target_count: procedure.target_count ?? 1,
      target_year: procedure.target_year ?? 1,
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

    if (!form.category_id) {
      setLoading(false)
      setError('Selectionnez une categorie pour ce service.')
      return
    }

    const payload = {
      ...form,
      target_level: Number.parseInt(form.target_level, 10),
      target_count: Number.parseInt(form.target_count, 10) || 1,
      target_year: Number.parseInt(form.target_year, 10) || 1,
      objectif_final: Number.parseInt(form.target_level, 10),
      seuil_exposition_min: Number.parseInt(form.target_level, 10) === 1 ? Number.parseInt(form.target_count, 10) || 1 : 0,
      seuil_supervision_min: Number.parseInt(form.target_level, 10) === 2 ? Number.parseInt(form.target_count, 10) || 1 : 0,
      seuil_autonomie_min: Number.parseInt(form.target_level, 10) === 3 ? Number.parseInt(form.target_count, 10) || 1 : 0,
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

    setModal(null)
    router.refresh()
  }

  async function handleDelete(id) {
    setLoading(true)
    setError('')
    const res = await deleteProcedure(id)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      setConfirmDelete(null)
      return
    }
    setConfirmDelete(null)
    setProcedures((current) => current.filter((procedure) => procedure.id !== id))
    router.refresh()
  }

  async function handleCategoryDelete(id) {
    setLoading(true)
    setError('')
    const res = await deleteCategory(id)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      setConfirmCategoryDelete(null)
      return
    }
    setConfirmCategoryDelete(null)
    setCategories((current) => current.filter((item) => item.id !== id))
    router.refresh()
  }

  async function handleCatSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const payload = { ...catForm, service: normalizeService(catForm.service), display_order: Number.parseInt(catForm.display_order, 10) || 0 }
    const res = catModal === 'create' ? await createCategory(payload) : await updateCategory(catModal.id, payload)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setCatModal(null)
    router.refresh()
  }

  function downloadReferentiel() {
    const categoryRows = categories.map((category) => ({
      type: 'category',
      name: category.name,
      service: normalizeService(category.service),
      color_hex: category.color_hex,
      display_order: category.display_order ?? 0,
    }))
    const procedureRows = procedures.map((procedure) => {
      const category = categories.find((item) => item.id === procedure.category_id)
      return {
        type: 'procedure',
        name: procedure.name,
        category_name: category?.name ?? '',
        service: normalizeService(procedure.service),
        pathologie: procedure.pathologie ?? '',
        target_level: procedure.target_level ?? procedure.objectif_final ?? 3,
        target_count: procedure.target_count ?? 1,
        target_year: procedure.target_year ?? 1,
      }
    })
    const headers = ['type', 'name', 'category_name', 'service', 'pathologie', 'target_level', 'target_count', 'target_year', 'color_hex', 'display_order']
    const rows = [...categoryRows, ...procedureRows].map((row) => headers.map((key) => csvCell(row[key])).join(','))
    downloadTextFile([headers.join(','), ...rows].join('\n'), 'referentiel-logbook.csv')
  }

  async function handleReferentielFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    const text = await file.text()
    const rows = parseCsv(text)
    const categoriesToImport = rows
      .filter((row) => row.type === 'category')
      .map((row) => ({ name: row.name, service: row.service, color_hex: row.color_hex, display_order: row.display_order }))
    const proceduresToImport = rows
      .filter((row) => row.type === 'procedure')
      .map((row) => ({
        name: row.name,
        category_name: row.category_name,
        service: row.service,
        pathologie: row.pathologie,
        target_level: row.target_level,
        target_count: row.target_count,
        target_year: row.target_year,
      }))
    const res = await importReferentiel({ categories: categoriesToImport, procedures: proceduresToImport })
    setLoading(false)
    event.target.value = ''
    if (res.error) {
      setError(res.error)
      return
    }
    router.refresh()
  }

  function applyDefaultPath() {
    const finalLevel = Number.parseInt(form.objectif_final, 10)
    const defaultMinCount = finalLevel === 2
        ? Number.parseInt(form.seuil_supervision_min, 10) || 1
        : Number.parseInt(form.seuil_autonomie_min, 10) || 1

    setForm((current) => ({
      ...current,
      objectives: current.objectives.map((objective) => ({
        ...objective,
        required_level: finalLevel === 1 ? 0 : objective.required_level,
        min_count: defaultMinCount,
      })),
    }))
  }

  const filtered = procedures.filter((procedure) => {
    const matchesCategory = !filterCat || procedure.category_id === filterCat
    const matchesService = !filterService || normalizeService(procedure.service) === filterService
    return matchesCategory && matchesService
  })
  const filterCategories = filterService ? categoriesForService(categories, filterService) : categories
  const formService = normalizeService(form.service)
  const formCategories = categoriesForService(categories, formService)
  const categoryGroups = SERVICE_OPTIONS.map((service) => ({
    ...service,
    categories: categoriesForService(categories, service.value),
  }))

  function setProcedureService(service) {
    const nextService = normalizeService(service)
    setForm((current) => {
      const currentCategory = categories.find((category) => category.id === current.category_id)
      const keepCategory = currentCategory && normalizeService(currentCategory.service) === nextService
      return {
        ...current,
        service: nextService,
        category_id: keepCategory ? current.category_id : firstCategoryForService(categories, nextService),
      }
    })
  }

  return (
    <>
      <PageHeader
        title="Gestes & Objectifs"
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={downloadReferentiel} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
              <FileDown size={16} /> Export
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
              <Upload size={16} /> Import
            </button>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleReferentielFile} />
            <button
              onClick={tab === 'gestes' ? openCreate : () => { setCatForm({ name: '', service: DEFAULT_SERVICE, color_hex: DEFAULT_CATEGORY_COLOR, display_order: 0 }); setCatModal('create') }}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-navy)' }}
            >
              <Plus size={16} /> {tab === 'gestes' ? 'Nouveau geste' : 'Nouvelle categorie'}
            </button>
          </div>
        }
      />
      {error && !modal && !catModal && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}

      <StatusTabs tabs={TABS} activeValue={tab} onChange={setTab} columns={2} className="mb-5 max-w-md" />

      {tab === 'gestes' && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <select
              value={filterCat}
              onChange={(event) => setFilterCat(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="">Toutes les categories</option>
              {filterCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={filterService}
              onChange={(event) => {
                setFilterService(event.target.value)
                setFilterCat('')
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="">Tous les services</option>
              {SERVICE_OPTIONS.map((service) => (
                <option key={service.value} value={service.value}>{service.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            {filtered.map((procedure) => {
              const category = categories.find((item) => item.id === procedure.category_id)
              const hasObjectives = procedure.procedure_objectives?.filter((objective) => objective.required_level > 1)
              return (
                <AppCard key={procedure.id} className="p-4">
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
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {SERVICE_LABELS[normalizeService(procedure.service)] ?? SERVICE_LABELS[DEFAULT_SERVICE]}
                        </span>
                      </div>
                      {procedure.pathologie && <p className="mt-0.5 text-xs text-slate-500">{procedure.pathologie}</p>}
                      <p className="mt-2 text-xs text-slate-500">
                        Objectif: {LEVELS[procedure.target_level ?? procedure.objectif_final] ?? '-'} · {procedure.target_count ?? 1} acte{(procedure.target_count ?? 1) > 1 ? 's' : ''} · A{procedure.target_year ?? 1}
                      </p>
                      <p className="hidden">
                        Objectif final: {LEVELS[procedure.objectif_final] ?? '-'} · Exposition {procedure.seuil_exposition_min ?? 0} · Supervision {procedure.seuil_supervision_min ?? 0} · Autonomie {procedure.seuil_autonomie_min ?? 0} · Déblocage auto {procedure.seuil_deblocage_autonomie ?? 0}
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
                </AppCard>
              )
            })}
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucun geste</p>}
          </div>
        </>
      )}

      {tab === 'categories' && (
        <div className="space-y-2">
          {categoryGroups.map((group) => (
            <div key={group.value} className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase text-slate-400">{group.label}</p>
              {group.categories.map((category) => (
                <AppCard key={category.id} className="flex items-center gap-3 p-4">
                  <div className="h-8 w-8 flex-shrink-0 rounded-lg" style={{ backgroundColor: category.color_hex }} />
                  <span className="flex-1 text-sm font-medium text-slate-800">{category.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setCatForm({ name: category.name, service: normalizeService(category.service), color_hex: category.color_hex, display_order: category.display_order ?? 0 }); setCatModal(category) }}
                      className="rounded-lg p-2 hover:bg-slate-100"
                    >
                      <Pencil size={15} className="text-slate-500" />
                    </button>
                    <button
                      onClick={() => setConfirmCategoryDelete(category)}
                      className="rounded-lg p-2 hover:bg-red-50"
                    >
                      <Trash2 size={15} className="text-red-500" />
                    </button>
                  </div>
                </AppCard>
              ))}
              {group.categories.length === 0 && (
                <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-400">Aucune categorie pour ce service.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <AppModal title={modal === 'create' ? 'Nouveau geste' : 'Modifier'} onClose={() => setModal(null)} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nom du geste" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Service</label>
                <select
                  value={form.service}
                  onChange={(event) => setProcedureService(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  {SERVICE_OPTIONS.map((service) => (
                    <option key={service.value} value={service.value}>{service.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Categorie</label>
                <select
                  value={form.category_id}
                  onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Choisir une categorie</option>
                  {formCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                {formCategories.length === 0 && (
                  <p className="mt-2 text-xs text-orange-600">Creez d&apos;abord une categorie pour {SERVICE_LABELS[formService]}.</p>
                )}
              </div>
              <Field label="Pathologie" value={form.pathologie} onChange={(value) => setForm((current) => ({ ...current, pathologie: value }))} />
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Niveau objectif</label>
                <select
                  value={form.target_level}
                  onChange={(event) => setForm((current) => ({ ...current, target_level: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  {[1, 2, 3].map((level) => <option key={level} value={level}>{LEVELS[level]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre requis" type="number" value={form.target_count} onChange={(value) => setForm((current) => ({ ...current, target_count: value }))} />
                <Field label="Année cible" type="number" value={form.target_year} onChange={(value) => setForm((current) => ({ ...current, target_year: value }))} />
              </div>
              <div className="hidden">
                <Field label="Seuil exposition" type="number" value={form.seuil_exposition_min} onChange={(value) => setForm((current) => ({ ...current, seuil_exposition_min: value }))} />
                <Field label="Seuil supervision" type="number" value={form.seuil_supervision_min} onChange={(value) => setForm((current) => ({ ...current, seuil_supervision_min: value }))} />
                <Field label="Seuil autonomie" type="number" value={form.seuil_autonomie_min} onChange={(value) => setForm((current) => ({ ...current, seuil_autonomie_min: value }))} />
                <Field label="Deblocage autonome" type="number" value={form.seuil_deblocage_autonomie} onChange={(value) => setForm((current) => ({ ...current, seuil_deblocage_autonomie: value }))} />
              </div>
              <div className="hidden">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Objectifs par année</p>
                  </div>
                  <button
                    type="button"
                    onClick={applyDefaultPath}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Parcours par defaut
                  </button>
                </div>
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
                        {Object.entries(OBJECTIVE_LEVELS).map(([key, label]) => (
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
                style={{ backgroundColor: 'var(--color-navy)' }}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
        </AppModal>
      )}

      {catModal !== null && (
        <AppModal title={catModal === 'create' ? 'Nouvelle catégorie' : 'Modifier'} onClose={() => setCatModal(null)} maxWidth="max-w-sm">
            <form onSubmit={handleCatSubmit} className="space-y-4">
              <Field label="Nom" value={catForm.name} onChange={(value) => setCatForm((current) => ({ ...current, name: value }))} required />
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Service</label>
                <select
                  value={catForm.service}
                  onChange={(event) => setCatForm((current) => ({ ...current, service: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  {SERVICE_OPTIONS.map((service) => (
                    <option key={service.value} value={service.value}>{service.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>Couleur</label>
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
                style={{ backgroundColor: 'var(--color-navy)' }}
              >
                {loading ? '...' : 'Enregistrer'}
              </button>
            </form>
        </AppModal>
      )}

      {confirmDelete && (
        <AppModal title={`Désactiver "${confirmDelete.name}" ?`} subtitle="Le geste sera masqué du référentiel." onClose={() => setConfirmDelete(null)} maxWidth="max-w-sm">
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
        </AppModal>
      )}

      {confirmCategoryDelete && (
        <ConfirmDialog
          title={`Supprimer "${confirmCategoryDelete.name}" ?`}
          description="La categorie sera supprimee si aucun geste ne l'utilise."
          confirmLabel="Supprimer"
          loading={loading}
          onCancel={() => setConfirmCategoryDelete(null)}
          onConfirm={() => handleCategoryDelete(confirmCategoryDelete.id)}
        />
      )}
    </>
  )
}
function Field({ label, type = 'text', value, onChange, required }) {
  return (
    <FormField label={label}>
      <TextInput
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </FormField>
  )
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function downloadTextFile(content, filename) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
  })
}

function splitCsvLine(line) {
  const cells = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"' && line[index + 1] === '"') {
      current += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells
}
