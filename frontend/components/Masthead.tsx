import Link from "next/link";
import { orgColor } from "@/lib/orgColor";
import type { Organization } from "@/lib/types";

/**
 * The signature element: an unmissable "which ledger am I looking at"
 * band. Tenant isolation is a hard backend guarantee (see DECISIONS.md in
 * the repo root); this makes it a hard *visual* guarantee too — there is
 * no view of this product where the current org isn't the loudest thing
 * on screen. Keyed by orgId so switching orgs re-plays the entrance
 * animation, giving the switch a felt "new ledger, opened" moment instead
 * of a silent content swap.
 */
export function Masthead({
  orgs,
  currentOrgId,
}: {
  orgs: Organization[];
  currentOrgId?: string;
}) {
  const current = orgColor(currentOrgId ?? "");

  return (
    <header>
      <div className="bg-ink text-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          {currentOrgId ? (
            <div key={currentOrgId} className="animate-stamp-in flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: current.fg }}
              />
              <div>
                <p className="font-mono text-caption tracking-widest text-surface/55 uppercase">
                  Viewing dealer group
                </p>
                <p className="text-heading font-semibold tracking-tight">{currentOrgId}</p>
              </div>
            </div>
          ) : (
            <p className="text-heading font-semibold tracking-tight">Choose a dealer group</p>
          )}
          <div className="text-right">
            <p className="font-mono text-caption tracking-widest text-surface/55 uppercase">DealerOS</p>
            <p className="text-ui text-surface/85">Reconciliation Ledger</p>
          </div>
        </div>
      </div>

      {orgs.length > 0 && (
        <nav
          aria-label="Switch dealer group"
          className="border-b border-rule-strong bg-surface px-6 py-2.5"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
            <span className="text-caption text-ink-faint">Switch:</span>
            {orgs.map((org) => {
              const color = orgColor(org.org_id);
              const active = org.org_id === currentOrgId;
              return (
                <Link
                  key={org.org_id}
                  href={`/orgs/${encodeURIComponent(org.org_id)}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-medium transition-colors ${
                    active
                      ? "border-transparent"
                      : "border-rule-strong text-ink-secondary hover:border-ink-secondary"
                  }`}
                  style={active ? { background: color.tint, color: color.fg } : undefined}
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: color.fg }}
                  />
                  {org.org_id}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
