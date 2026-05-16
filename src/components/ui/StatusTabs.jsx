import Link from 'next/link'

export default function StatusTabs({ tabs, activeValue, counts = {}, onChange, hrefFor, columns = 4, className = '' }) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  }[columns] ?? 'grid-cols-4'

  return (
    <div className={`grid ${gridCols} gap-1 rounded-2xl bg-slate-100 p-1 ${className}`}>
      {tabs.map((tab) => {
        const active = activeValue === tab.value
        const content = (
          <>
            <span className="block truncate">{tab.label}</span>
            {(tab.value in counts || tab.count != null) && (
              <span className="text-xs opacity-75">{tab.count ?? counts[tab.value] ?? 0}</span>
            )}
          </>
        )
        const className = 'rounded-xl px-1.5 py-2 text-center text-[11px] font-semibold transition sm:px-3 sm:text-sm'
        const style = active ? { backgroundColor: 'var(--color-navy)', color: 'white' } : { color: '#64748b' }

        if (hrefFor) {
          return (
            <Link key={tab.value} href={hrefFor(tab.value)} className={className} style={style}>
              {content}
            </Link>
          )
        }

        return (
          <button key={tab.value} type="button" onClick={() => onChange?.(tab.value)} className={className} style={style}>
            {content}
          </button>
        )
      })}
    </div>
  )
}

