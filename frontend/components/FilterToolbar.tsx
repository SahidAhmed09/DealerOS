"use client";

import { REASON_LABEL, REASONS, type Ordering, type Reason } from "@/lib/types";
import { ReasonMark } from "./ReasonMark";

const ORDERING_OPTIONS: { value: Ordering; label: string }[] = [
  { value: "-sort_value", label: "Value, high to low" },
  { value: "sort_value", label: "Value, low to high" },
  { value: "-created_at", label: "Newest first" },
  { value: "created_at", label: "Oldest first" },
];

export function FilterToolbar({
  counts,
  total,
  activeReason,
  ordering,
  onReasonChange,
  onOrderingChange,
}: {
  counts: Record<Reason, number>;
  total: number;
  activeReason: Reason | null;
  ordering: Ordering;
  onReasonChange: (reason: Reason | null) => void;
  onOrderingChange: (ordering: Ordering) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-rule pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="group"
        aria-label="Filter by reason"
        className="flex flex-wrap items-center gap-1.5"
      >
        <FilterPill
          active={activeReason === null}
          onClick={() => onReasonChange(null)}
          count={total}
          label="All"
        />
        {REASONS.map((reason) => (
          <FilterPill
            key={reason}
            active={activeReason === reason}
            onClick={() => onReasonChange(reason)}
            count={counts[reason] ?? 0}
            label={REASON_LABEL[reason]}
            mark={<ReasonMark reason={reason} size="sm" />}
          />
        ))}
      </div>

      <label className="flex items-center gap-2 text-caption text-ink-secondary">
        Sort
        <select
          value={ordering}
          onChange={(event) => onOrderingChange(event.target.value as Ordering)}
          className="rounded-md border border-rule-strong bg-surface px-2 py-1.5 text-caption font-medium text-ink shadow-xs focus-visible:outline-none"
        >
          {ORDERING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  count,
  label,
  mark,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  label: string;
  mark?: React.ReactNode;
}) {
  const disabled = count === 0 && !active;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-medium whitespace-nowrap transition-colors ${
        active
          ? "border-ledger-red/40 bg-ledger-red-tint text-ledger-red-ink"
          : disabled
            ? "border-rule text-ink-faint/50"
            : "border-rule-strong text-ink-secondary hover:border-ink-secondary hover:text-ink"
      }`}
    >
      {mark}
      {label}
      <span className={active ? "text-ledger-red-ink/70" : "text-ink-faint"}>{count}</span>
    </button>
  );
}
