export const REASONS = [
  "MISSING_IN_B",
  "ORPHAN_ENTRY",
  "DUPLICATE_ENTRY",
  "VALUE_MISMATCH",
  "DATE_MISMATCH",
  "LOCATION_MISMATCH",
] as const;

export type Reason = (typeof REASONS)[number];

export const REASON_LABEL: Record<Reason, string> = {
  MISSING_IN_B: "Missing in B",
  ORPHAN_ENTRY: "Orphan entry",
  DUPLICATE_ENTRY: "Duplicate entry",
  VALUE_MISMATCH: "Value mismatch",
  DATE_MISMATCH: "Date mismatch",
  LOCATION_MISMATCH: "Location mismatch",
};

// Short glyphs for the reason "stamp" marks in the filter bar and table.
// Chosen for what they mean, not decoration: an em-dash for "nothing here",
// a broken link for "points at nothing", a doubled mark for "entered twice",
// unequal/calendar/pin for the three head-to-head field mismatches.
export const REASON_MARK: Record<Reason, string> = {
  MISSING_IN_B: "—",
  ORPHAN_ENTRY: "↯",
  DUPLICATE_ENTRY: "∷",
  VALUE_MISMATCH: "≠",
  DATE_MISMATCH: "□",
  LOCATION_MISMATCH: "⚑",
};

export interface Organization {
  org_id: string;
}

export interface Disagreement {
  id: number;
  reason: Reason;
  reason_display: string;
  organization: string | null;
  location: string | null;
  record_id: string | null;
  a_value: string;
  b_value: string;
  sort_value: string | null;
  detail: string;
  created_at: string;
}

export type Ordering = "sort_value" | "-sort_value" | "created_at" | "-created_at";

export interface OrgSummary {
  org_id: string;
  system_a_records_checked: number;
  system_b_entries_checked: number;
  disagreements_found: number;
  records_reconciled_cleanly: number;
}
