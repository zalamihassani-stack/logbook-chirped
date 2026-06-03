'use client'
import { useState } from 'react'
import { TrendingUp, Target } from 'lucide-react'
import ProgressionTab from './ProgressionTab'
import ObjectifsTab from './ObjectifsTab'

const TABS = [
  { id: 'residents', label: 'Résidents', icon: TrendingUp },
  { id: 'objectifs', label: 'Gestes', icon: Target },
]

export default function SuiviClient({ residents, teacherService }) {
  const [tab, setTab] = useState('residents')

  return (
    <div className="max-w-6xl p-4 md:p-8">
      <h1 className="mb-1 text-xl font-bold" style={{ color: 'var(--color-navy)' }}>
        Suivi
      </h1>
      <p className="mb-4 text-sm text-slate-500 md:mb-6">Progression des résidents et suivi par geste</p>

      <div className="mb-5 flex w-full gap-1 rounded-xl bg-slate-100 p-1 md:mb-6">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors"
            style={tab === tabItem.id ? { backgroundColor: 'var(--color-navy)', color: 'white' } : { color: '#64748b' }}
          >
            <tabItem.icon size={15} className="flex-shrink-0" strokeWidth={1.75} />
            <span>{tabItem.label}</span>
          </button>
        ))}
      </div>

      {tab === 'residents' && <ProgressionTab residents={residents} teacherService={teacherService} />}
      {tab === 'objectifs' && <ObjectifsTab residents={residents} teacherService={teacherService} />}
    </div>
  )
}
