# Decisions

Format: the decision, the alternative rejected, and the one line that separated them.

1. **Tenant (org) scoping is derived from System A's location only, never System B's.**
   Rejected: trusting whichever system's location looked "more recent," or leaving conflicting records unscoped.
   Why: A owns the record's identity (`record_id`); anchoring org membership to A is the one rule a dirty B row can't override — it's what keeps REC-1077 (A says org A's branch, B says org B's) from ever leaking to the wrong tenant.

2. **SQLite (Django's built-in DB), not Postgres.**
   Rejected: Postgres via docker-compose.
   Why: "does it run from a clean clone" is 30% of the grade; SQLite needs no extra service running.

3. **Added two disagreement reasons beyond the four named in the brief: `LOCATION_MISMATCH` and `DATE_MISMATCH`.**
   Rejected: sticking strictly to the four required types.
   Why: the dataset contains exactly one real instance of each (REC-1077, REC-1009), and location mismatch is a direct, concrete test of the "do not leak across the boundary" requirement the brief calls out by name.

4. **A record with 2+ System B entries is only flagged `DUPLICATE_ENTRY` if the entries neither match individually nor sum to System A's total.**
   Rejected: flag any record with more than one B entry as a duplicate.
   Why: REC-1055 has two B entries that individually don't match A's total but add up to it exactly — the brief explicitly warns that this kind of non-error must be recognized as a non-error, and a naive count-based rule would misclassify it.

5. **Currency parsing strips every comma, then parses the remainder as a decimal.**
   Rejected: a locale-aware number-parsing library.
   Why: this dataset has both US-style ("125,400.00") and Indian lakh-style ("1,25,400.00") grouping; stripping all commas before parsing the single decimal point handles both without a new dependency for one row.

6. **Org scoping is a required URL path segment (`/api/orgs/<org_id>/disagreements/`), not an optional query parameter.**
   Rejected: `?org=ORG-A` as an optional filter, defaulting to all orgs when omitted.
   Why: there's no auth to derive a tenant from (brief says skip it), so a query param is a filter someone can forget. Making org part of the URL means there's no way to call the endpoint and get another tenant's rows by accident.

7. **The `Disagreement` table is fully rebuilt on every reconcile run, not incrementally diffed.**
   Rejected: an upsert-style sync that only touches changed rows.
   Why: it's a derived view over ~240 source rows total; rebuilding from scratch is easier to reason about and removes a whole class of stale-row bugs, for a cost that doesn't matter at this size.

8. **A record with two independent problems (e.g. wrong value *and* wrong date) produces two separate `Disagreement` rows, not one row summarizing both.**
   Rejected: one row per record listing every problem it has.
   Why: keeps "filter by reason" meaningful — a record with two issues shouldn't hide one behind the other.
