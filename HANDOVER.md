# Handover

Living doc — read this first each session. Update it before ending one.

## Where things stand (2026-08-14)

**Done:**
- Django project scaffolded in `backend/` (SQLite, DRF, django-cors-headers).
- Models: `Organization`, `Location`, `SystemARecord`, `SystemBEntry`, `Disagreement` (`reconciliation/models.py`).
- `manage.py import_data` — loads all three CSVs, survives every dirty row we catalogued (malformed `record_ref` in 4 formats, blank fields, comma-grouped numbers) without dropping any of the 120 A rows or 121 B rows. Logs what it couldn't cleanly parse.
- `manage.py reconcile` — rebuilds the `Disagreement` table. Detects all 4 required types (missing-in-B, orphan entry, duplicate entry, value mismatch) plus two extra ones the data justified (date mismatch, location mismatch). Correctly treats the REC-1055 split as a non-error and REC-1042 as a real duplicate.
- 24 passing tests in `reconciliation/tests/` (`test_utils.py` for the parsing helpers, `test_reconciliation.py` for every disagreement type + the split/duplicate distinction + tenant isolation).
- API: `GET /api/orgs/` and `GET /api/orgs/<org_id>/disagreements/?reason=...&ordering=sort_value`. Verified live against the real dataset — ORG-A has 7 disagreements, ORG-B has 4, and REC-1077 (the location-conflict record) only ever shows up under ORG-A.
- Verified the whole pipeline from a wiped `db.sqlite3` (clean-clone simulation): migrate → import_data → reconcile → test, all clean.
- Git repo initialized at project root, pushed to `https://github.com/SahidAhmed09/DealerOS.git`, `main` branch.

**Not started yet:**
- Frontend (React or Next.js — not yet decided with the user).
- `README.md` (how to run it, what was built, what was deliberately skipped, "how I worked with the agent" section, 3 reflection questions).
- Django admin is intentionally left unregistered (would need auth, which is out of scope).

## What to watch out for

- The `Disagreement` table is rebuilt from scratch every `reconcile` run — never hand-edit rows in it.
- Org scoping is always derived from **System A's** location (see DECISIONS.md #1). If you touch `services.py`, don't let System B's location leak into the `organization` field anywhere.
- Real dataset paths: `DealerOS_Assignment_Dataset/{locations,system_a,system_b}.csv` at repo root; importer defaults to `backend/../DealerOS_Assignment_Dataset`.
- Venv is at `backend/.venv`, not committed (see `.gitignore`). `backend/db.sqlite3` is also gitignored — it's fully reproducible via `migrate && import_data && reconcile`.

## Next session should

1. Confirm stack choice for the frontend with the user (Django+React vs Next.js).
2. Scaffold the frontend, build the single reconciliation table screen (filter by reason, sort by value, org switcher).
3. Write `README.md` and answer the three reflection questions honestly.
