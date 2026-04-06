'use client'
import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { getInitials, ROLE_LABELS } from '@/lib/utils'
import { createUser, updateUser, deleteUser } from '@/app/actions/admin'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const TABS = ['Tous', 'Résidents', 'Enseignants', 'Admins']
const TAB_ROLE = { 'Résidents': 'resident', 'Enseignants': 'enseignant', 'Admins': 'admin' }

const EMPTY_FORM = { full_name: '', email: '', password: '', role: 'resident', residanat_start_date: '', promotion: '' }

export default function UserManagement({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers)
  const [tab, setTab] = useState('Tous')
  const [modal, setModal] = useState(null) // null | 'create' | { ...user }
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = tab === 'Tous' ? users : users.filter(u => u.role === TAB_ROLE[tab])

  function openCreate() { setForm(EMPTY_FORM); setError(''); setModal('create') }
  function openEdit(u) {
    setForm({ full_name: u.full_name ?? '', email: '', password: '', role: u.role, residanat_start_date: u.residanat_start_date ?? '', promotion: u.promotion ?? '' })
    setError('')
    setModal(u)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    let res
    if (modal === 'create') {
      res = await createUser(form)
    } else {
      const { email, password, ...rest } = form
      res = await updateUser(modal.id, rest)
    }
    setLoading(false)
    if (res.error) { setError(res.error); return }
    window.location.reload()
  }

  async function handleDelete(id) {
    setLoading(true)
    await deleteUser(id)
    setLoading(false)
    setConfirmDelete(null)
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${users.length} compte(s) enregistré(s)`}
        action={
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: '#0D2B4E' }}>
            <Plus size={16} /> Ajouter
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition"
            style={tab === t
              ? { backgroundColor: '#0D2B4E', color: 'white' }
              : { backgroundColor: 'white', color: '#0D2B4E', border: '1px solid #e2e8f0' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: '#E8F4FC', color: '#0D2B4E' }}>
              {getInitials(u.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{u.full_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge status={u.role} />
                {u.promotion && <span className="text-xs text-slate-500">Promo {u.promotion}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-slate-100 transition">
                <Pencil size={15} className="text-slate-500" />
              </button>
              <button onClick={() => setConfirmDelete(u)} className="p-2 rounded-lg hover:bg-red-50 transition">
                <Trash2 size={15} className="text-red-500" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Aucun utilisateur</p>
        )}
      </div>

      {/* Modal créer/modifier */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg" style={{ color: '#0D2B4E' }}>
                {modal === 'create' ? 'Ajouter un utilisateur' : 'Modifier'}
              </h2>
              <button onClick={() => setModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nom complet" value={form.full_name} onChange={v => setForm(f => ({ ...f, full_name: v }))} required />
              {modal === 'create' && <>
                <Field label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required />
                <Field label="Mot de passe" type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} required />
              </>}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0D2B4E' }}>Rôle</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none">
                  <option value="resident">Résident</option>
                  <option value="enseignant">Enseignant</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              {form.role === 'resident' && <>
                <Field label="Date début résidanat" type="date" value={form.residanat_start_date} onChange={v => setForm(f => ({ ...f, residanat_start_date: v }))} />
                <Field label="Promotion" value={form.promotion} onChange={v => setForm(f => ({ ...f, promotion: v }))} />
              </>}
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

      {/* Confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="font-semibold text-slate-800 mb-2">Supprimer {confirmDelete.full_name} ?</p>
            <p className="text-sm text-slate-500 mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm">Annuler</button>
              <button onClick={() => handleDelete(confirmDelete.id)} disabled={loading}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium disabled:opacity-60">
                {loading ? '…' : 'Supprimer'}
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
