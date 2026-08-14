import type { OrgSummary } from "@/lib/types";

/**
 * Proves the import actually covered everything, in the product itself
 * rather than only in conversation: "why are there only a few rows" gets
 * an answer right above the table it's asking about.
 */
export function CoverageStrip({ summary }: { summary: OrgSummary }) {
  const items: { label: string; hint: string; value: number; tone?: "accent" }[] = [
    {
      label: "System A records checked",
      hint: "Every event record imported from System A's export for this dealer group.",
      value: summary.system_a_records_checked,
    },
    {
      label: "System B entries checked",
      hint: "Every entry imported from System B's export, including ones with no matching System A record.",
      value: summary.system_b_entries_checked,
    },
    {
      label: "Reconciled cleanly",
      hint: "System A records where System B's entry matched with no disagreement found.",
      value: summary.records_reconciled_cleanly,
    },
    {
      label: "Disagreements found",
      hint: "Records or entries where System A and System B don't agree, or where one has no counterpart in the other.",
      value: summary.disagreements_found,
      tone: "accent",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-surface px-4 py-3">
          <dt title={item.hint} className="w-fit text-caption text-ink-faint underline decoration-dotted decoration-ink-faint/50 underline-offset-2">
            {item.label}
          </dt>
          <dd
            className={`tabular-figures mt-0.5 font-mono text-heading-sm font-semibold ${
              item.tone === "accent" ? "text-ledger-red-ink" : "text-ink"
            }`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
