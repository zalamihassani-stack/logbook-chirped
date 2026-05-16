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
import { createUser, updateUser, deleteUser } from '@/app/actions/admin'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const TABS = [
  { value: 'all', label: 'Tous' },
  { value: 'resident', label: 'Résidents' },
  { value: 'enseignant', label: 'Enseignants' },
  { value: 'admin', label: 'Admins' },
]

const EMPTY_FORM = { full_name: '', email: '', password: '', role: 'resident', residanat_start_date: '', promotion: '' }

export default function UserManagement({ initialUsers }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [tab, setTab] = useState('all')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const counts = {
    all: users.length,
    resident: users.filter((user) => user.role === 'resident').length,
    enseignant: users.filter((user) => user.role === 'enseignant').length,
    admin: users.filter((user) => user.role === 'admin').length,
  }
  const filtered = tab === 'all' ? users : users.filter((user) => user.role === tab)

  function openCreate() {
    setForm(EMPTY_FORM)
    setError('')
    setModal('create')
  }

  function openEdit(user) {
    setForm({ full_name: user.full_name ?? '', email: '', password: '', role: user.role, residanat_start_date: user.residanat_start_date ?? '', promotion: user.promotion ?? '' })
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

  async function handleDelete(id) {
    setLoading(true)
    setError('')
    const res = await deleteUser(id)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      setConfirmDelete(null)
      return
    }
    setConfirmDelete(null)
    setUsers((current) => current.filter((user) => user.id !== id))
    router.refresh()
  }

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${users.length} compte(s) enregistrés`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-navy)' }}>
            <Plus size={16} /> Ajouter
          </button>
        }
      />
      {error && !modal && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      <StatusTabs tabs={TABS} activeValue={tab} counts={counts} onChange={setTab} columns={4} className="mb-5" />

      <div className="space-y-2">
        {filtered.map((user) => (
          <AppCard key={user.id} className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: 'var(--color-ice)', color: 'var(--color-navy)' }}>
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{user.full_name}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge status={user.role} />
                {user.promotion && <span className="text-xs text-slate-500">Promo {user.promotion}</span>}
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <button onClick={() => openEdit(user)} className="rounded-lg p-2 transition hover:bg-slate-100" aria-label="Modifier">
                <Pencil size={15} className="text-slate-500" />
              </button>
              <button onClick={() => setConfirmDelete(user)} className="rounded-lg p-2 transition hover:bg-red-50" aria-label="Supprimer">
                <Trash2 size={15} className="text-red-500" />
              </button>
            </div>
          </AppCard>
        ))}
        {filtered.length === 0 && <p className="rounded-2xl bg-white py-8 text-center text-sm text-slate-400">Aucun utilisateur</p>}
      </div>

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

      {confirmDelete && (
        <AppModal title={`Supprimer ${confirmDelete.full_name} ?`} subtitle="Cette action est irréversible." onClose={() => setConfirmDelete(null)} maxWidth="max-w-sm">
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm">Annuler</button>
            <button onClick={() => handleDelete(confirmDelete.id)} disabled={loading} className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white disabled:opacity-60">
              {loading ? '...' : 'Supprimer'}
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

