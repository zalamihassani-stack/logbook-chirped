'use client'
import { useState } from 'react'
import { Activity, TrendingUp, ClipboardList, Target } from 'lucide-react'
import ActesTab from './ActesTab'
import ProgressionTab from './ProgressionTab'
import ObjectifsTab from './ObjectifsTab'
import PrioritesTab from './PrioritesTab'

const TABS = [
  { id: 'priorites', label: 'Priorités', icon: Activity },
  { id: 'residents', label: 'Residents', icon: TrendingUp },
  { id: 'objectifs', label: 'Objectifs', icon: Target },
  { id: 'journal', label: 'Journal des actes', icon: ClipboardList },
]

export default function SuiviClient({ residents, procedures, enseignants }) {
  const [tab, setTab] = useState('priorites')

  return (
    <div className="max-w-6xl p-4 md:p-8">
      <h1 className="mb-1 text-xl font-bold" style={{ color: 'var(--color-navy)' }}>
        Suivi
      </h1>
      <p className="mb-4 text-sm text-slate-500 md:mb-6">Suivi pedagogique des residents, des objectifs et du journal des actes</p>

      <div className="mb-5 grid w-full grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 md:mb-6 md:flex">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:text-sm"
            style={tab === tabItem.id ? { backgroundColor: 'var(--color-navy)', color: 'white' } : { color: '#64748b' }}
          >
            <tabItem.icon size={15} className="flex-shrink-0" strokeWidth={1.75} />
            <span className="truncate">{tabItem.label}</span>
          </button>
        ))}
      </div>

      {tab === 'priorites' && <PrioritesTab residents={residents} />}
      {tab === 'residents' && <ProgressionTab residents={residents} />}
      {tab === 'objectifs' && <ObjectifsTab residents={residents} />}
      {tab === 'journal' && <ActesTab residents={residents} procedures={procedures} enseignants={enseignants} />}
    </div>
  )
}
