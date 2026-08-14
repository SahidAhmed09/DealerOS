# Constraints

Short and explicit, per the brief and the AI Collaboration Field Guide. Update this if a real constraint changes — don't let it go stale.

- **No authentication.** The brief says skip it entirely. `ALLOWED_HOSTS`/CORS are wide open on purpose — do not "helpfully" add login, JWT, or session auth.
- **No visual design work.** A plain table is the correct answer, not a placeholder. Don't spend time on CSS.
- **No performance work.** ~240 total source rows across both systems. Don't add caching, pagination tuning, or query optimization for its own sake.
- **Org/tenant scoping must always come from System A's location**, never System B's. Any new comparison logic that touches location must respect this (see DECISIONS.md #1).
- **The `Disagreement` table is derived, not authoritative.** Never hand-edit it or treat it as a second source of truth — it's rebuilt by `manage.py reconcile`.
- **Stack: Django + DRF, SQLite.** No new database engine, no new backend framework, without discussing it first.
- **New dependencies require a note in DECISIONS.md.** Don't silently add packages.
