// A small fixed set of identity colors for the org switcher only — never
// used elsewhere in the UI, so the rest of the tool looks identical no
// matter which org is selected. Assigned by a stable hash so it scales
// past the two orgs in the sample dataset without collapsing to one color.
const PALETTE = [
  { fg: "var(--color-org-a)", tint: "var(--color-org-a-tint)" },
  { fg: "var(--color-org-b)", tint: "var(--color-org-b-tint)" },
  { fg: "#8a5a2b", tint: "#f3ebe0" },
  { fg: "#6a4c93", tint: "#efe9f4" },
] as const;

export function orgColor(orgId: string) {
  let hash = 0;
  for (let i = 0; i < orgId.length; i++) {
    hash = (hash * 31 + orgId.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
