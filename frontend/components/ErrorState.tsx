export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 border border-ledger-red/30 bg-ledger-red-tint px-6 py-14 text-center"
    >
      <p className="text-heading-sm font-semibold text-ledger-red-ink">Couldn&apos;t load the ledger</p>
      <p className="max-w-sm text-body text-ledger-red-ink/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 rounded-md border border-ledger-red/40 bg-surface px-3 py-1.5 text-caption font-medium text-ledger-red-ink transition-colors hover:bg-ledger-red-tint"
      >
        Try again
      </button>
    </div>
  );
}
