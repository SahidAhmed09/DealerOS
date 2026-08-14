"use client";

import { Fragment, useState } from "react";
import { REASON_LABEL, type Disagreement } from "@/lib/types";
import { Chevron } from "./Chevron";
import { ReasonMark } from "./ReasonMark";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Every row is collapsed to its scannable essentials by default (reason,
 * record, location, both values, when it was logged) and expands in place
 * to reveal the full explanation - progressive disclosure instead of a
 * modal, per the product's own "exhaust inline alternatives first" rule.
 * Desktop and mobile share the same interaction: click/tap a row, or focus
 * it and press Enter or Space.
 */
export function LedgerTable({ rows }: { rows: Disagreement[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      {/* Desktop / tablet: a real table. Ledger rules, not card chrome. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[760px] border-collapse text-body">
          <thead>
            <tr className="border-b-2 border-rule-strong text-left text-caption text-ink-secondary uppercase">
              <th className="w-10 py-2.5 pr-3 font-medium">Reason</th>
              <th className="py-2.5 pr-3 font-medium">Record</th>
              <th className="py-2.5 pr-3 font-medium">Location</th>
              <th
                title="What System A recorded for this event."
                className="py-2.5 pr-3 text-right font-medium underline decoration-dotted decoration-ink-faint/50 underline-offset-2"
              >
                System A
              </th>
              <th
                title="What System B recorded for the same event."
                className="py-2.5 pr-3 text-right font-medium underline decoration-dotted decoration-ink-faint/50 underline-offset-2"
              >
                System B
              </th>
              <th className="py-2.5 pl-3 text-right font-medium">Logged</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isExpanded = expanded.has(row.id);
              return (
                <Fragment key={row.id}>
                  <tr
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? "Collapse" : "Expand"} details for ${row.record_id ?? "orphan entry"}`}
                    onClick={() => toggle(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggle(row.id);
                      }
                    }}
                    style={{ animationDelay: `${Math.min(index, 12) * 18}ms` }}
                    className={`animate-row-in cursor-pointer border-b border-rule align-top [animation-fill-mode:backwards] hover:bg-ground/70 focus-visible:relative focus-visible:z-10 ${
                      isExpanded ? "bg-ground/70" : ""
                    }`}
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-1.5">
                        <ReasonMark reason={row.reason} />
                        <Chevron expanded={isExpanded} />
                      </div>
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
                    <td className="py-3 pl-3 text-right font-mono text-caption whitespace-nowrap text-ink-faint">
                      {formatDate(row.created_at)}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-rule bg-ground/50">
                      <td colSpan={6} className="px-3 py-4">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6">
                          <p className="max-w-2xl text-body text-ink-secondary">{row.detail}</p>
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-caption whitespace-nowrap">
                            <dt className="text-ink-faint">System A (full)</dt>
                            <dd className="tabular-figures font-mono text-ink">{row.a_value}</dd>
                            <dt className="text-ink-faint">System B (full)</dt>
                            <dd className="tabular-figures font-mono text-ink">{row.b_value}</dd>
                            <dt className="text-ink-faint">Logged</dt>
                            <dd className="font-mono text-ink">{formatDateTime(row.created_at)}</dd>
                          </dl>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: the table collapses to stacked ledger cards, same tap-to-expand pattern. */}
      <ul className="flex flex-col gap-3 sm:hidden">
        {rows.map((row, index) => {
          const isExpanded = expanded.has(row.id);
          return (
            <li
              key={row.id}
              style={{ animationDelay: `${Math.min(index, 12) * 18}ms` }}
              className="animate-row-in overflow-hidden rounded-lg border border-rule bg-surface [animation-fill-mode:backwards]"
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => toggle(row.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ReasonMark reason={row.reason} />
                    <span className="text-caption font-medium text-ink-secondary">
                      {REASON_LABEL[row.reason]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-data font-medium">
                      {row.record_id ?? <span className="text-ink-faint">—</span>}
                    </span>
                    <Chevron expanded={isExpanded} />
                  </div>
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
              </button>
              {isExpanded && (
                <p className="border-t border-rule bg-ground/50 px-4 py-3 text-caption text-ink-secondary">
                  {row.detail}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
