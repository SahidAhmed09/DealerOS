export function EmptyState({
  heading,
  body,
  action,
}: {
  heading: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 border border-dashed border-rule-strong px-6 py-14 text-center">
      <p className="text-heading-sm font-semibold">{heading}</p>
      <p className="max-w-sm text-body text-ink-secondary">{body}</p>
      {action}
    </div>
  );
}
