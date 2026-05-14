'use client'
import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { saveSettings } from '@/app/actions/admin'

const TOGGLES = [
  { key: 'push_notifications', label: 'Notifications push', desc: 'Envoyer des notifications aux résidents et enseignants' },
  { key: 'validation_required', label: 'Validation obligatoire', desc: 'Les actes doivent être validés par un enseignant' },
  { key: 'allow_hors_objectifs', label: 'Autoriser les gestes hors objectifs', desc: 'Les résidents peuvent enregistrer des gestes hors de leur programme annuel' },
  { key: 'compte_rendu_required', label: 'Compte rendu obligatoire', desc: 'Le compte rendu opératoire est requis à la soumission' },
]

export default function ReglagesClient({ initialSettings, missingSettingsTable = false }) {
  const [settings, setSettings] = useState({
    push_notifications: false,
    validation_required: true,
    allow_hors_objectifs: true,
    compte_rendu_required: false,
    ...initialSettings,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true); setSaved(false); setError('')
    const res = await saveSettings(settings)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <>
      <PageHeader title="Réglages" subtitle="Configuration générale de l'application" />
      <div className="max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          {TOGGLES.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
                style={{ backgroundColor: settings[key] ? 'var(--color-navy)' : '#e2e8f0' }}
              >
                <span
                  className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform"
                  style={{ transform: settings[key] ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>}
        {missingSettingsTable && !error && (
          <p className="mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-2.5">
            Table app_settings absente. Executez supabase/app_settings.sql dans Supabase, puis rechargez cette page.
          </p>
        )}
        {saved && <p className="mt-3 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2.5">Réglages enregistrés.</p>}

        <button onClick={handleSave} disabled={loading}
          className="mt-4 w-full py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-navy)' }}>
          {loading ? 'Enregistrement…' : 'Sauvegarder'}
        </button>
      </div>
    </>
  )
}
