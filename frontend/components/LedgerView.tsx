"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError, getDisagreements } from "@/lib/api";
import { REASON_LABEL, REASONS, type Disagreement, type Ordering, type Reason } from "@/lib/types";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { FilterToolbar } from "./FilterToolbar";
import { LedgerTable } from "./LedgerTable";
import { SkeletonRows } from "./SkeletonRows";

/**
 * All the interactive behavior for one org's ledger: fetch once per org,
 * then filter and sort in memory. The backend already decided what counts
 * as a disagreement and why (that's the part under test) - this component
 * only rearranges an already-correct result set for reading, it never
 * re-derives it. See CODE_WALKTHROUGH.md.
 *
 * The parent renders this with `key={orgId}` (see app/orgs/[orgId]/page.tsx),
 * so switching orgs remounts it fresh rather than needing a manual state
 * reset here - state only ever needs to move forward inside the effect
 * below, in the async callbacks, never synchronously at the top of it.
 */
export function LedgerView({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<Disagreement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [reasonFilter, setReasonFilter] = useState<Reason | null>(null);
  const [ordering, setOrdering] = useState<Ordering>("-sort_value");

  useEffect(() => {
    let ignore = false;
    getDisagreements(orgId)
      .then((data) => {
        if (!ignore) setRows(data);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong loading this ledger.",
        );
      });
    return () => {
      ignore = true;
    };
  }, [orgId, attempt]);

  // A plain event handler, not an effect - safe to reset state synchronously
  // here before kicking off the retry.
  const retry = () => {
    setRows(null);
    setError(null);
    setNotFound(false);
    setAttempt((a) => a + 1);
  };

  const counts = useMemo(() => {
    const base = Object.fromEntries(REASONS.map((r) => [r, 0])) as Record<Reason, number>;
    for (const row of rows ?? []) base[row.reason] += 1;
    return base;
  }, [rows]);

  const visibleRows = useMemo(() => {
    if (!rows) return [];
    const filtered = reasonFilter ? rows.filter((r) => r.reason === reasonFilter) : rows;
    const sorted = [...filtered].sort((a, b) => {
      const [field, direction] = ordering.startsWith("-")
        ? [ordering.slice(1), -1]
        : [ordering, 1];
      if (field === "sort_value") {
        const av = a.sort_value === null ? -Infinity : Number(a.sort_value);
        const bv = b.sort_value === null ? -Infinity : Number(b.sort_value);
        return (av - bv) * direction;
      }
      return (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0) * direction;
    });
    return sorted;
  }, [rows, reasonFilter, ordering]);

  if (notFound) {
    return (
      <EmptyState
        heading={`No dealer group named "${orgId}"`}
        body="It may have been renamed, or the link is out of date."
        action={
          <Link href="/" className="mt-1 text-caption font-medium text-ledger-red-ink underline">
            Back to dealer groups
          </Link>
        }
      />
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  if (rows === null) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-10 w-full max-w-md animate-pulse rounded bg-rule" aria-hidden="true" />
        <SkeletonRows />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FilterToolbar
        counts={counts}
        total={rows.length}
        activeReason={reasonFilter}
        ordering={ordering}
        onReasonChange={setReasonFilter}
        onOrderingChange={setOrdering}
      />

      {rows.length === 0 ? (
        <EmptyState
          heading="No disagreements"
          body={`System A and System B agree on every record in ${orgId}'s ledger right now.`}
        />
      ) : visibleRows.length === 0 ? (
        <EmptyState
          heading={`No ${REASON_LABEL[reasonFilter as Reason].toLowerCase()} rows`}
          body={`${orgId} doesn't have any disagreements of this kind right now.`}
        />
      ) : (
        <LedgerTable rows={visibleRows} />
      )}
    </div>
  );
}
