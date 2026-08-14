import type { OrgSummary } from "@/lib/types";

/**
 * Proves the import actually covered everything, in the product itself
 * rather than only in conversation: "why are there only a few rows" gets
 * an answer right above the table it's asking about.
 */
export function CoverageStrip({ summary }: { summary: OrgSummary }) {
  const items: { label: string; value: number; tone?: "accent" }[] = [
    { label: "System A records checked", value: summary.system_a_records_checked },
    { label: "System B entries checked", value: summary.system_b_entries_checked },
    { label: "Reconciled cleanly", value: summary.records_reconciled_cleanly },
    { label: "Disagreements found", value: summary.disagreements_found, tone: "accent" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-surface px-4 py-3">
          <dt className="text-caption text-ink-faint">{item.label}</dt>
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
