import { REASON_MARK, type Reason } from "@/lib/types";

const SIZE_CLASSES = {
  sm: "h-5 w-5 text-[0.7rem]",
  md: "h-6 w-6 text-[0.8rem]",
} as const;

/**
 * The small ink-stamp glyph for one disagreement reason. Used identically
 * in the filter pills and the table's Reason column, so the same mark
 * always means the same thing wherever it appears on screen.
 */
export function ReasonMark({
  reason,
  size = "md",
}: {
  reason: Reason;
  size?: keyof typeof SIZE_CLASSES;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-[3px] border border-ledger-red/30 bg-ledger-red-tint font-mono font-medium text-ledger-red-ink ${SIZE_CLASSES[size]}`}
    >
      {REASON_MARK[reason]}
    </span>
  );
}
