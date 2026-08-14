import { Masthead } from "@/components/Masthead";
import { LedgerView } from "@/components/LedgerView";
import { getOrganizations } from "@/lib/api";

export default async function OrgLedgerPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  let orgs: Awaited<ReturnType<typeof getOrganizations>> = [];
  try {
    orgs = await getOrganizations();
  } catch {
    // The masthead just shows fewer switcher options; LedgerView surfaces
    // the real error state for the actual data fetch below.
  }

  return (
    <div className="min-h-full">
      <Masthead orgs={orgs} currentOrgId={orgId} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <LedgerView key={orgId} orgId={orgId} />
      </main>
    </div>
  );
}
