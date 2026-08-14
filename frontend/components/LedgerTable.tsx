import { REASON_LABEL, type Disagreement } from "@/lib/types";
import { ReasonMark } from "./ReasonMark";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LedgerTable({ rows }: { rows: Disagreement[] }) {
  return (
    <>
      {/* Desktop / tablet: a real table. Ledger rules, not card chrome. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[860px] border-collapse text-body">
          <thead>
            <tr className="border-b-2 border-rule-strong text-left text-caption text-ink-secondary uppercase">
              <th className="w-10 py-2.5 pr-3 font-medium">Reason</th>
              <th className="py-2.5 pr-3 font-medium">Record</th>
              <th className="py-2.5 pr-3 font-medium">Location</th>
              <th className="py-2.5 pr-3 text-right font-medium">System A</th>
              <th className="py-2.5 pr-3 text-right font-medium">System B</th>
              <th className="py-2.5 pr-3 font-medium">Detail</th>
              <th className="py-2.5 pl-3 text-right font-medium">Logged</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                style={{ animationDelay: `${Math.min(index, 12) * 18}ms` }}
                className="animate-row-in border-b border-rule align-top [animation-fill-mode:backwards] hover:bg-ground/70"
              >
                <td className="py-3 pr-3">
                  <ReasonMark reason={row.reason} />
                </td>
                <td className="py-3 pr-3 font-mono text-data font-medium whitespace-nowrap">
                  {row.record_id ?? <span className="text-ink-faint">—</span>}
                </td>
                <td className="py-3 pr-3 font-mono text-data whitespace-nowrap text-ink-secondary">
                  {row.location ?? <span className="text-ink-faint">—</span>}
                </td>
                <td className="tabular-figures py-3 pr-3 text-right font-mono text-data">
                  <span
                    title={row.a_value.length > 18 ? row.a_value : undefined}
                    className="block max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {row.a_value}
                  </span>
                </td>
                <td className="tabular-figures py-3 pr-3 text-right font-mono text-data">
                  <span
                    title={row.b_value.length > 18 ? row.b_value : undefined}
                    className="block max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {row.b_value}
                  </span>
                </td>
                <td className="py-3 pr-3 text-ink-secondary">
                  <p className="max-w-md">{row.detail}</p>
                </td>
                <td className="py-3 pl-3 text-right font-mono text-caption whitespace-nowrap text-ink-faint">
                  {formatDate(row.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: the table collapses to stacked ledger cards, not a scroll cage. */}
      <ul className="flex flex-col gap-3 sm:hidden">
        {rows.map((row, index) => (
          <li
            key={row.id}
            style={{ animationDelay: `${Math.min(index, 12) * 18}ms` }}
            className="animate-row-in rounded-lg border border-rule bg-surface p-4 [animation-fill-mode:backwards]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ReasonMark reason={row.reason} />
                <span className="text-caption font-medium text-ink-secondary">
                  {REASON_LABEL[row.reason]}
                </span>
              </div>
              <span className="font-mono text-data font-medium">
                {row.record_id ?? <span className="text-ink-faint">—</span>}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-data">
              <div>
                <dt className="text-caption text-ink-faint">System A</dt>
                <dd className="tabular-figures font-mono">{row.a_value}</dd>
              </div>
              <div>
                <dt className="text-caption text-ink-faint">System B</dt>
                <dd className="tabular-figures font-mono">{row.b_value}</dd>
              </div>
              <div>
                <dt className="text-caption text-ink-faint">Location</dt>
                <dd className="font-mono">{row.location ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-caption text-ink-faint">Logged</dt>
                <dd className="font-mono text-ink-secondary">{formatDate(row.created_at)}</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-rule pt-3 text-caption text-ink-secondary">
              {row.detail}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
