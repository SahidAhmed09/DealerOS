import type { Disagreement, Ordering, Organization, Reason } from "./types";

// Talks directly to the Django API from the browser (CORS is open on the
// backend for exactly this reason). No server-side proxy: the contract is
// the same REST API the backend's own tests already exercise.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";

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
