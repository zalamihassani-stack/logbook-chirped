'use client'
import { useState } from 'react'
import { Activity, FlaskConical, TrendingUp, ClipboardList, Clock, Users, BookOpen } from 'lucide-react'
import ActesTab from './ActesTab'
import TravauxTab from './TravauxTab'
import ProgressionTab from './ProgressionTab'

const TABS = [
  { id: 'actes',      label: 'Actes réalisés',     icon: ClipboardList },
  { id: 'travaux',    label: 'Travaux scientifiques', icon: FlaskConical },
  { id: 'progression', label: 'Progression',        icon: TrendingUp },
]

export default function SuiviClient({ stats, residents, procedures, enseignants, travailTypes }) {
  const [tab, setTab] = useState('actes')

  return (
    <div className="p-5 md:p-8 max-w-6xl">
      <h1 className="text-xl font-bold mb-1" style={{ color: '#0D2B4E' }}>Suivi des activités</h1>
      <p className="text-sm text-slate-500 mb-6">Vue globale de l'activité des résidents</p>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        {[
          { label: 'Actes ce mois', value: stats.actesMonth,     icon: Activity,      bg: '#E8F4FC', color: '#0D2B4E' },
          { label: 'En attente',    value: stats.actesAttente,   icon: Clock,         bg: '#fef9c3', color: '#854d0e' },
          { label: 'Résidents actifs', value: stats.residentsActifs, icon: Users,     bg: '#dcfce7', color: '#166534' },
          { label: 'Travaux soumis', value: stats.travauxSoumis, icon: BookOpen,      bg: '#f3e8ff', color: '#6b21a8' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
              <s.icon size={18} color={s.color} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-full md:w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={tab === t.id
              ? { backgroundColor: '#0D2B4E', color: 'white' }
              : { color: '#64748b' }}>
            <t.icon size={15} strokeWidth={1.75} />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden text-xs">{t.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Contenu */}
      {tab === 'actes'       && <ActesTab residents={residents} procedures={procedures} enseignants={enseignants} />}
      {tab === 'travaux'     && <TravauxTab residents={residents} travailTypes={travailTypes} />}
      {tab === 'progression' && <ProgressionTab residents={residents} />}
    </div>
  )
}
