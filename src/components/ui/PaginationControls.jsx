import Link from 'next/link'

export default function PaginationControls({ page, hasNext, params, basePath }) {
  if (page === 1 && !hasNext) return null

  const previousParams = new URLSearchParams(params)
  const nextParams = new URLSearchParams(params)
  previousParams.set('page', String(Math.max(1, page - 1)))
  nextParams.set('page', String(page + 1))

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={`${basePath}?${previousParams.toString()}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          Page précédente
        </Link>
      ) : <span />}
      <span className="text-xs text-slate-400">Page {page}</span>
      {hasNext ? (
        <Link href={`${basePath}?${nextParams.toString()}`} className="rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-navy)' }}>
          Page suivante
        </Link>
      ) : <span />}
    </div>
  )
}

