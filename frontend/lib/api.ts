import type { Disagreement, Ordering, OrgSummary, Organization, Reason } from "./types";

// Talks directly to the Django API (CORS is open on the backend for exactly
// this reason). No server-side proxy: the contract is the same REST API the
// backend's own tests already exercise.
//
// Two different base URLs on purpose. Some of this file's functions are
// called from the browser (client components like LedgerView) and some from
// Server Components (app/page.tsx, app/orgs/[orgId]/page.tsx) that run
// inside the Next.js server process itself. Outside Docker those are the
// same machine, so one URL works for both. Inside Docker they're two
// different containers: the browser can only reach the backend via the port
// published on the host (NEXT_PUBLIC_API_BASE_URL, baked in at build time),
// while the frontend container reaching the backend container has to go
// through Compose's internal network instead - "localhost" from inside the
// frontend container means the frontend container, not the backend one.
// API_INTERNAL_BASE_URL (not NEXT_PUBLIC_, so it's read fresh at request
// time, never baked into the browser bundle) covers that second case, and
// falls back to the public URL when unset - which is exactly right for
// running outside Docker, where there is no separate container to reach.
const API_BASE_URL =
  typeof window === "undefined"
    ? (process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api")
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api");

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function get<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  } catch {
    throw new ApiError(
      "Couldn't reach the reconciliation API. Is the Django server running?",
    );
  }
  if (!response.ok) {
    throw new ApiError(
      `The API responded with an error (${response.status}).`,
      response.status,
    );
  }
  return response.json() as Promise<T>;
}

export function getOrganizations(): Promise<Organization[]> {
  return get<Organization[]>("/orgs/");
}

export function getOrgSummary(orgId: string): Promise<OrgSummary> {
  return get<OrgSummary>(`/orgs/${encodeURIComponent(orgId)}/summary/`);
}

export function getDisagreements(
  orgId: string,
  options: { reason?: Reason; ordering?: Ordering } = {},
): Promise<Disagreement[]> {
  const params = new URLSearchParams();
  if (options.reason) params.set("reason", options.reason);
  if (options.ordering) params.set("ordering", options.ordering);
  const query = params.toString();
  return get<Disagreement[]>(
    `/orgs/${encodeURIComponent(orgId)}/disagreements/${query ? `?${query}` : ""}`,
  );
}
