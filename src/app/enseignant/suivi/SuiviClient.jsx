'use client'
import { useState } from 'react'
import { Activity, FlaskConical, TrendingUp, ClipboardList, Clock, Users, BookOpen } from 'lucide-react'
import ActesTab from './ActesTab'
import TravauxTab from './TravauxTab'
import ProgressionTab from './ProgressionTab'

const TABS = [
  { id: 'actes', label: 'Actes realises', icon: ClipboardList },
  { id: 'travaux', label: 'Travaux scientifiques', icon: FlaskConical },
  { id: 'progression', label: 'Progression', icon: TrendingUp },
]

export default function SuiviClient({ stats, residents, procedures, enseignants, travailTypes }) {
  const [tab, setTab] = useState('actes')

  return (
    <div className="max-w-6xl p-5 md:p-8">
      <h1 className="mb-1 text-xl font-bold" style={{ color: '#0D2B4E' }}>
        Suivi des activites
      </h1>
      <p className="mb-6 text-sm text-slate-500">Vue globale de l&apos;activite des residents</p>

      <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Actes ce mois', value: stats.actesMonth, icon: Activity, bg: '#E8F4FC', color: '#0D2B4E' },
          { label: 'En attente', value: stats.actesAttente, icon: Clock, bg: '#fef9c3', color: '#854d0e' },
          { label: 'Residents actifs', value: stats.residentsActifs, icon: Users, bg: '#dcfce7', color: '#166534' },
          { label: 'Travaux soumis', value: stats.travauxSoumis, icon: BookOpen, bg: '#f3e8ff', color: '#6b21a8' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: stat.bg }}
            >
              <stat.icon size={18} color={stat.color} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex w-full gap-1 rounded-xl bg-slate-100 p-1 md:w-fit">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:flex-none md:justify-start md:px-4"
            style={tab === tabItem.id ? { backgroundColor: '#0D2B4E', color: 'white' } : { color: '#64748b' }}
          >
            <tabItem.icon size={15} strokeWidth={1.75} />
            <span className="hidden sm:inline">{tabItem.label}</span>
            <span className="text-xs sm:hidden">{tabItem.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {tab === 'actes' && <ActesTab residents={residents} procedures={procedures} enseignants={enseignants} />}
      {tab === 'travaux' && <TravauxTab residents={residents} travailTypes={travailTypes} />}
      {tab === 'progression' && <ProgressionTab residents={residents} />}
    </div>
  )
}
