export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-3/4 rounded bg-slate-200" />
          <div className="h-2.5 w-1/2 rounded bg-slate-100" />
        </div>
        <div className="h-5 w-10 rounded-full bg-slate-200" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/2 rounded bg-slate-200" />
          <div className="h-2.5 w-2/3 rounded bg-slate-100" />
        </div>
        <div className="h-5 w-16 rounded-full bg-slate-200" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 4, variant = 'card' }) {
  const Component = variant === 'row' ? SkeletonRow : SkeletonCard
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => <Component key={i} />)}
    </div>
  )
}
