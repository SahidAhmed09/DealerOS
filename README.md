# DealerOS Reconciliation

A screen that shows every place two record-keeping systems (System A and System B) disagree about the same dealership events, scoped strictly to one dealer group at a time. Built for the DealerOS full-stack take-home.

Companion documents that go deeper than this one:

- `DECISIONS.md`, ten short entries: the decision, the alternative rejected, and the one line that separated them.
- `TEST_REPORT.md`, the full output of a fresh test run and a fresh reconciliation run, with every disagreement entry listed. See the Tests section below for the short version.

## Clone and set up

Four steps, start to finish: clone, set up the backend, set up the frontend, run both. You'll need Python 3.11+ and Node 18+, that's it, the dataset is already included in the clone.

### 1. Clone the repo

```
git clone https://github.com/SahidAhmed09/DealerOS.git
cd DealerOS
```

The three dataset CSVs (`locations.csv`, `system_a.csv`, `system_b.csv`) come with the clone, already sitting at `DealerOS_Assignment_Dataset/` in the repo root, one level up from `backend/`, exactly where the importer expects them (see `DECISIONS.md` #10 for why they're committed rather than a manual setup step). Nothing to fetch or place by hand. If you ever need to point the importer somewhere else anyway, `python manage.py import_data --path <your-dir>` overrides the default location.

### 2. Set up and run the backend

From the repo root:

```
cd backend
python -m venv .venv
.venv\Scripts\activate          (Mac/Linux: source .venv/bin/activate)
pip install -r requirements.txt
python manage.py migrate
python manage.py import_data
python manage.py reconcile
python manage.py test reconciliation
python manage.py runserver 8000
```

No `.env` file needed here, there's nothing secret to configure (no auth, no external services, SQLite is just a file). `migrate` builds the database, `import_data` loads the three CSVs, `reconcile` computes every disagreement, `test` confirms the 24 tests pass, and `runserver` starts the API at `http://127.0.0.1:8000`. Leave this terminal running.

### 3. Set up and run the frontend

In a **second terminal**, from the repo root:

```
cd frontend
npm install
copy .env.example .env.local        (Mac/Linux: cp .env.example .env.local)
npm run dev
```

`.env.local` holds one variable, `NEXT_PUBLIC_API_BASE_URL`, already set to `http://127.0.0.1:8000/api` in `.env.example`, matching the backend's default port from step 2. Change it there if you ran the backend on a different port. Opens at `http://localhost:3000`.

### 4. You're running

Both terminals need to stay open, the frontend talks directly to the Django API in the browser. Visit `http://localhost:3000`, pick a dealer group, and the ledger loads from the live backend.

## What was built

Everything the brief asked for, plus a few things the data justified:

- **Import.** Both CSVs load into a real database (`Organization`, `Location`, `SystemARecord`, `SystemBEntry`), and nothing gets dropped: every dirty `record_ref` spelling, every blank field, every comma-grouped currency value is imported and flagged in the import log rather than silently skipped.
- **Compare.** All four required disagreement types (missing in B, orphan entry, duplicate entry, value mismatch), plus two more the dataset actually contained: a date mismatch and a location mismatch. The location mismatch is the one that directly proves tenant isolation: a record where System A and System B disagree about which dealer group it even belongs to still never leaks into the wrong org's results.
- **Show.** A ledger-styled table, filterable by reason and sortable by value, exactly as asked. Each row expands in place to reveal the full explanation without a modal. A small coverage strip above the table shows how many records were actually checked, so a low disagreement count reads as "most records agree," not "data went missing."
- **Test.** 24 backend tests, one for every disagreement type plus the two edge cases that are easy to get wrong: a record that looks like a duplicate but is actually a valid split (shouldn't be flagged), and a record with conflicting org signals (must never leak to the wrong tenant).

## Tests

The test code lives in its own folder under the backend, `backend/reconciliation/tests/`, separate from the application code it tests:

- `test_utils.py`, tests for the two parsing helpers (`normalize_record_ref`, `parse_money`): all four dirty `record_ref` spellings found in the dataset, both currency-grouping styles, and blank or garbage input.
- `test_reconciliation.py`, tests for the actual comparison logic, the part the brief specifically asks to be tested. One test per required disagreement type, plus the two edge cases that are easy to get wrong (a record that looks like a duplicate but is actually a valid split, and a record with conflicting org signals that must never leak to the wrong tenant).

**Result, from a fresh run: 24 of 24 tests passed.**

| What's tested | Result |
|---|---|
| A record in System A with no entry in System B | pass |
| A System B entry pointing at a record that doesn't exist | pass |
| The same record entered into System B twice | pass |
| The two systems reporting different values | pass |
| A date mismatch, and a location mismatch (found in the data, not required by name but caught anyway) | pass |
| A "false positive" duplicate that's actually a valid split, correctly not flagged | pass |
| A conflicting-org record, confirmed it never leaks to the other org's results | pass |
| Currency and record-reference parsing against every dirty format in the dataset | pass |

For the full detail, the exact test names, the raw pass/fail log, and every one of the 11 real disagreement entries the reconciliation produced when run fresh against the actual dataset, see `TEST_REPORT.md` at the repo root.

Run it yourself:

```
cd backend
python manage.py test reconciliation
```

## What was deliberately left out

Per the brief's own scope guidance, and a few calls of our own:

- **No authentication.** The brief says skip it entirely, and we did. Org selection is a URL segment, not a login.
- **No visual polish beyond what the brief allows.** The brief says a plain table is correct; the version here is more considered than the strict minimum (a real design direction, not just default browser styling), but no time went into anything the brief calls out of scope, like performance tuning for a 120-row dataset.
- **No frontend automated tests.** The backend has 24 tests covering the actual comparison logic, which is what the brief asks for. The frontend was verified by hand: live clicking through every filter and sort combination, and deliberately killing the Django server mid-session to confirm the error and retry state actually recovers, not just that it renders. See the reflection answers below for why this is the part we'd fix first.
- **No "browse everything" view.** Only disagreements are shown, per the brief. A full record browser (all 120 System A records, agreeing or not) was discussed but not built, since it would work against the brief's own instruction to keep this an exceptions report, not a data browser.
- **No real mobile device testing.** The mobile layout was verified by forcing the responsive breakpoint through injected CSS in this environment, since the browser automation tool's window-resize call didn't actually change the viewport here. The layout itself follows standard, well-supported responsive patterns, but it hasn't been confirmed on an actual phone.

## How I worked with the agent

Before any code was written, Claude read the full assignment brief, wrote an actual verification script against the raw CSVs rather than eyeballing them, and read through a field guide I provided on how to collaborate on code with an AI agent (documentation habits, review discipline, and so on). That set the tone for the rest of the session: plan before code, small reviewable changes, and verify claims instead of trusting them.

The backend was built one logical layer at a time (schema, then importer, then reconciliation logic, then tests, then API), each step its own git commit, so the commit history itself shows the real build order rather than one large squash at the end. Every meaningful claim was checked against a real run: the reconciliation output was compared row by row against the hand-verified list of anomalies in the raw CSVs, the entire pipeline was re-run from a wiped database to simulate a clean clone, and the frontend's error handling was tested by actually stopping and restarting the Django server mid-session, not just by reading the code and assuming it would work.

`DECISIONS.md` was kept as a living document through the build, updated as real decisions got made, not written retroactively at the end. When ESLint flagged a real issue in the frontend's data-fetching code (a synchronous state update inside a React effect), the fix was the actual recommended pattern, not a suppressed warning, and understanding why the rule existed was part of the fix, not an afterthought.

## Reflection

**a. Name one thing the AI agent got wrong. How did you notice?**

The first version of the frontend's data-fetching logic (`LedgerView.tsx`) reset its loading state directly inside a `useEffect` callback, before starting the actual fetch. That's a pattern React's own documentation shows as normal, so it looked completely fine on read-through. Running `npm run lint`, which was part of the verification step after every real change, not something either of us skipped, caught it: ESLint's `react-hooks/set-state-in-effect` rule flagged it as a call that can trigger an extra, unnecessary render. Rather than silencing the warning, I asked for the reasoning behind it, and the real fix turned out to be a different pattern entirely: the parent component now remounts `LedgerView` fresh on every org switch (via a `key={orgId}` prop) instead of manually resetting state inside the effect. I noticed it because running the actual lint and type checks after every change, not just trusting that the code compiles, is a habit from the field guide I'd insisted on from the start.

**b. Which part of your submission are you least confident about, and why?**

The frontend has zero automated tests. Every bit of its behavior, org switching, filtering, sorting, the tenant boundary actually holding in the UI, the error and retry flow, was verified by hand: clicking through it live, and deliberately stopping the backend mid-session to prove recovery works. That's defensible against the brief, which asks for tests on the comparison logic specifically, and that logic (the backend's 24 tests) is well covered. But if someone changed `LedgerTable.tsx` or `LedgerView.tsx` next month, nothing would catch a regression automatically the way the backend's test suite would catch one there. That's the part of this submission I'd trust least under real pressure.

**c. If you had a second day, what would you fix first?**

Frontend tests, directly following from the answer above. I'd add component tests for the display logic (does the right row show up when a reason filter is applied, does sorting actually reorder the list) and at least one end-to-end test that walks through the tenant-isolation guarantee itself from the browser: open ORG-A, confirm the location-mismatch record shows up there, switch to ORG-B, confirm it doesn't. Right behind that, I'd want to verify the responsive layout on an actual phone or a real narrow viewport instead of the CSS-forced simulation used during this build, since that's an honest gap, not a confirmed pass.
