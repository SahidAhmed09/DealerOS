export function SkeletonRows() {
  return (
    <div aria-hidden="true" aria-busy="true" className="animate-pulse">
      <div className="hidden sm:block">
        <div className="border-b-2 border-rule-strong py-2.5" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-rule py-3">
            <div className="h-6 w-6 rounded-[3px] bg-rule" />
            <div className="h-3.5 w-20 rounded bg-rule" />
            <div className="h-3.5 w-16 rounded bg-rule" />
            <div className="ml-auto h-3.5 w-24 rounded bg-rule" />
            <div className="h-3.5 w-24 rounded bg-rule" />
            <div className="h-3.5 w-40 rounded bg-rule" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border border-rule bg-surface" />
        ))}
      </div>
      <span className="sr-only">Loading disagreements…</span>
    </div>
  );
}
