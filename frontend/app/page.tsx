import Link from "next/link";
import { Masthead } from "@/components/Masthead";
import { getOrganizations } from "@/lib/api";
import { orgColor } from "@/lib/orgColor";

export default async function OrgPickerPage() {
  let orgs: Awaited<ReturnType<typeof getOrganizations>> = [];
  let loadError: string | null = null;

  try {
    orgs = await getOrganizations();
  } catch {
    loadError =
      "Couldn't reach the reconciliation API. Start the Django server (manage.py runserver) and reload.";
  }

  return (
    <div className="min-h-full">
      <Masthead orgs={[]} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-heading-sm font-semibold">Choose a dealer group</h2>
        <p className="mt-1 max-w-xl text-body text-ink-secondary">
          Each dealer group only ever sees its own disagreements between System A and
          System B, pick one to open its ledger.
        </p>

        {loadError ? (
          <div
            role="alert"
            className="mt-6 max-w-lg border border-ledger-red/30 bg-ledger-red-tint px-5 py-4 text-body text-ledger-red-ink"
          >
            {loadError}
          </div>
        ) : orgs.length === 0 ? (
          <p className="mt-6 text-body text-ink-secondary">
            No dealer groups found yet. Run the backend&apos;s <code className="font-mono">import_data</code> and{" "}
            <code className="font-mono">reconcile</code> management commands first.
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => {
              const color = orgColor(org.org_id);
              return (
                <li key={org.org_id}>
                  <Link
                    href={`/orgs/${encodeURIComponent(org.org_id)}`}
                    className="group flex items-center justify-between gap-3 border border-rule-strong bg-surface px-5 py-4 transition-colors hover:border-ink-secondary"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: color.fg }}
                      />
                      <span className="text-ui font-semibold">{org.org_id}</span>
                    </span>
                    <span className="text-caption text-ink-faint group-hover:text-ink-secondary">
                      Open ledger →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
