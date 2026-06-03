'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import AppCard from '@/components/ui/AppCard'
import AppModal from '@/components/ui/AppModal'
import StatusTabs from '@/components/ui/StatusTabs'
import FormField, { SelectInput, TextInput } from '@/components/ui/FormField'
import { getInitials } from '@/lib/utils'
import { DEFAULT_SERVICE, SERVICE_LABELS, SERVICE_OPTIONS, normalizeService } from '@/lib/logbook'
import { createUser, updateUser, deactivateUser, reactivateUser, resetUserPassword } from '@/app/actions/admin'
import { Plus, Pencil, Power, RotateCcw, Search, KeyRound } from 'lucide-react'

const TABS = [
  { value: 'all', label: 'Tous' },
  { value: 'resident', label: 'Résidents' },
  { value: 'enseignant', label: 'Enseignants' },
  { value: 'admin', label: 'Admins' },
  { value: 'inactive', label: 'Inactifs' },
]

const EMPTY_FORM = { full_name: '', email: '', password: '', role: 'resident', service: DEFAULT_SERVICE, residanat_start_date: '', promotion: '' }
const PAGE_SIZE = 25

export default function UserManagement({ initialUsers }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [passwordModal, setPasswordModal] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDeactivate, setConfirmDeactivate] = useState(null)

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const counts = {
    all: users.filter((user) => user.is_active !== false).length,
    resident: users.filter((user) => user.role === 'resident' && user.is_active !== false).length,
    enseignant: users.filter((user) => user.role === 'enseignant' && user.is_active !== false).length,
    admin: users.filter((user) => user.role === 'admin' && user.is_active !== false).length,
    inactive: users.filter((user) => user.is_active === false).length,
  }
  const filtered = users.filter((user) => {
    const matchesTab = tab === 'inactive'
      ? user.is_active === false
      : user.is_active !== false && (tab === 'all' || user.role === tab)
    const needle = query.trim().toLowerCase()
    const haystack = [user.full_name, user.email, user.promotion, user.role, SERVICE_LABELS[normalizeService(user.service)]].filter(Boolean).join(' ').toLowerCase()
    return matchesTab && (!needle || haystack.includes(needle))
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visibleUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function changeTab(value) {
    setTab(value)
    setPage(1)
  }

  function changeQuery(value) {
    setQuery(value)
    setPage(1)
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setError('')
    setModal('create')
  }

  function openEdit(user) {
    setForm({ full_name: user.full_name ?? '', email: '', password: '', role: user.role, service: normalizeService(user.service), residanat_start_date: user.residanat_start_date ?? '', promotion: user.promotion ?? '' })
    setError('')
    setModal(user)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const res = modal === 'create'
      ? await createUser(form)
      : await updateUser(modal.id, (({ email, password, ...rest }) => rest)(form))
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setModal(null)
    router.refresh()
  }

  async function handleDeactivate(id) {
    setLoading(true)
    setError('')
    const res = await deactivateUser(id)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      setConfirmDeactivate(null)
      return
    }
    setConfirmDeactivate(null)
    setUsers((current) => current.map((user) => user.id === id ? { ...user, is_active: false } : user))
    router.refresh()
  }

  async function handleReactivate(id) {
    setLoading(true)
    setError('')
    const res = await reactivateUser(id)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setUsers((current) => current.map((user) => user.id === id ? { ...user, is_active: true } : user))
    router.refresh()
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    if (!passwordModal) return
    setLoading(true)
    setError('')
    const res = await resetUserPassword(passwordModal.id, newPassword)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setPasswordModal(null)
    setNewPassword('')
  }

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${counts.all} compte(s) actif(s)`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-navy)' }}>
            <Plus size={16} /> Ajouter
          </button>
        }
      />
      {error && !modal && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      <StatusTabs tabs={TABS} activeValue={tab} counts={counts} onChange={changeTab} columns={5} className="mb-5" />

      <label className="relative mb-5 block">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
          placeholder="Rechercher nom, email, promotion..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-400"
        />
      </label>

      <div className="space-y-2">
        {visibleUsers.map((user) => (
          <AppCard key={user.id} className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: 'var(--color-ice)', color: 'var(--color-navy)' }}>
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{user.full_name}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge status={user.role} />
                {user.is_active === false && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Inactif</span>}
                {user.role === 'enseignant' && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{SERVICE_LABELS[normalizeService(user.service)] ?? SERVICE_LABELS[DEFAULT_SERVICE]}</span>}
                {user.promotion && <span className="text-xs text-slate-500">Promo {user.promotion}</span>}
              </div>
              {user.email && <p className="mt-0.5 truncate text-xs text-slate-400">{user.email}</p>}
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <button onClick={() => openEdit(user)} className="rounded-lg p-2 transition hover:bg-slate-100" aria-label="Modifier">
                <Pencil size={15} className="text-slate-500" />
              </button>
              <button onClick={() => { setPasswordModal(user); setNewPassword('') }} className="rounded-lg p-2 transition hover:bg-slate-100" aria-label="Mot de passe">
                <KeyRound size={15} className="text-slate-500" />
              </button>
              {user.is_active === false ? (
                <button onClick={() => handleReactivate(user.id)} disabled={loading} className="rounded-lg p-2 transition hover:bg-green-50" aria-label="Réactiver">
                  <RotateCcw size={15} className="text-green-600" />
                </button>
              ) : (
                <button onClick={() => setConfirmDeactivate(user)} className="rounded-lg p-2 transition hover:bg-red-50" aria-label="Désactiver">
                  <Power size={15} className="text-red-500" />
                </button>
              )}
            </div>
          </AppCard>
        ))}
        {filtered.length === 0 && <p className="rounded-2xl bg-white py-8 text-center text-sm text-slate-400">Aucun utilisateur</p>}
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-xs text-slate-400">Page {page} / {pageCount}</span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page >= pageCount}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}

      {modal !== null && (
        <AppModal
          title={modal === 'create' ? 'Ajouter un utilisateur' : 'Modifier'}
          onClose={() => setModal(null)}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nom complet" value={form.full_name} onChange={(value) => setForm((current) => ({ ...current, full_name: value }))} required />
            {modal === 'create' && (
              <>
                <Field label="Email" type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} required />
                <Field label="Mot de passe" type="password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} required />
              </>
            )}
            <FormField label="Rôle">
              <SelectInput value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                <option value="resident">Résident</option>
                <option value="enseignant">Enseignant</option>
                <option value="admin">Administrateur</option>
              </SelectInput>
            </FormField>
            {form.role === 'enseignant' && (
              <FormField label="Service">
                <SelectInput value={form.service} onChange={(event) => setForm((current) => ({ ...current, service: event.target.value }))}>
                  {SERVICE_OPTIONS.map((service) => (
                    <option key={service.value} value={service.value}>{service.label}</option>
                  ))}
                </SelectInput>
              </FormField>
            )}
            {form.role === 'resident' && (
              <>
                <Field label="Date début résidanat" type="date" value={form.residanat_start_date} onChange={(value) => setForm((current) => ({ ...current, residanat_start_date: value }))} />
                <Field label="Promotion" value={form.promotion} onChange={(value) => setForm((current) => ({ ...current, promotion: value }))} />
              </>
            )}
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: 'var(--color-navy)' }}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </AppModal>
      )}

      {passwordModal && (
        <AppModal title={`Mot de passe - ${passwordModal.full_name}`} onClose={() => setPasswordModal(null)} maxWidth="max-w-sm">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Field label="Nouveau mot de passe temporaire" type="password" value={newPassword} onChange={setNewPassword} required />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: 'var(--color-navy)' }}>
              {loading ? '...' : 'Mettre à jour'}
            </button>
          </form>
        </AppModal>
      )}

      {confirmDeactivate && (
        <AppModal title={`Désactiver ${confirmDeactivate.full_name} ?`} subtitle="Le compte ne pourra plus accéder à l'application." onClose={() => setConfirmDeactivate(null)} maxWidth="max-w-sm">
          <div className="flex gap-3">
            <button onClick={() => setConfirmDeactivate(null)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm">Annuler</button>
            <button onClick={() => handleDeactivate(confirmDeactivate.id)} disabled={loading} className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white disabled:opacity-60">
              {loading ? '...' : 'Désactiver'}
            </button>
          </div>
        </AppModal>
      )}
    </>
  )
}

function Field({ label, type = 'text', value, onChange, required }) {
  return (
    <FormField label={label}>
      <TextInput type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </FormField>
  )
}
