# Decisions

Nine choices made while building this project. Each one follows the same shape: what was decided, what was considered and turned down instead, and the plain reason that made the difference.

---

**1. Every disagreement is filed under the dealer group that System A says it belongs to. System B's opinion on that is never used to decide it.**

What we turned down: trusting whichever system's location looked more recent, or leaving a conflicting record unassigned to any dealer group at all.

Why: System A owns the record's identity in the first place, so anchoring the dealer group to what System A says is the one rule a messy System B entry can never override. This is exactly what stops a record like REC-1077, where System A says one dealer group and System B says another, from ever showing up on the wrong dealer group's screen.

---

**2. Two extra categories of disagreement were added beyond the four the brief explicitly asked for: a date mismatch, and a location mismatch.**

What we turned down: sticking strictly to only the four required categories and ignoring anything else the data showed.

Why: the real dataset contained one genuine example of each. The location mismatch in particular is a direct test of the brief's own rule that data must never leak between dealer groups, so it was worth catching rather than quietly setting aside.

---

**3. A record with two or more entries in System B only counts as a genuine duplicate if those entries also fail to add up to System A's total.**

What we turned down: flagging any record with more than one System B entry as a duplicate, with no further check.

Why: one real record in the dataset has two System B entries that don't match System A's total individually, but do add up to it correctly when combined, meaning System B simply logged it in two parts rather than making a mistake. That's not an error and shouldn't be treated like one. A simple "more than one entry means flag it" rule would have gotten this wrong.

---

**4. Reading a currency value works by stripping out every comma first, then reading whatever digits are left as a plain number.**

What we turned down: using a full locale-aware number-parsing library.

Why: the dataset mixes two different comma styles for the same kind of number, ordinary grouping like "125,400.00" and Indian-style grouping like "1,25,400.00". Removing every comma before reading the number handles both the same way, without pulling in a new dependency to solve a problem that shows up in only a couple of rows.

---

**5. Which dealer group you're viewing is part of the web address itself, like `/orgs/ORG-A/disagreements/`, rather than something added on as an optional extra.**

What we turned down: making the dealer group an optional filter that could be left off, defaulting to showing every dealer group's data if it was.

Why: this project has no login system, so nothing else identifies which dealer group is asking for data. An optional filter is something that could simply be forgotten. Making it a required part of the web address means there is no way to ask for this data at all without also saying whose data is meant, so a mistake here isn't possible by omission.

---

**6. The full list of disagreements is recalculated from scratch every time, rather than only updating the rows that changed.**

What we turned down: an approach that tries to detect and update only the specific rows that changed since the last run.

Why: the entire dataset is small, around 240 rows in total, so recalculating everything is fast and much simpler to reason about correctly. It also avoids an entire category of bugs where an old, outdated row gets accidentally left behind.

---

**7. If a single record has two separate problems at once, for example both a wrong value and a wrong date, it appears as two separate rows in the results, one per problem, rather than a single row trying to describe both.**

What we turned down: combining every problem a record has into one row.

Why: this keeps the "filter by reason" feature trustworthy. If two problems were squeezed into a single row, filtering down to just date mismatches could hide a row that genuinely belongs there too, just because that row also happened to have a separate value problem.

---

**8. Filtering and sorting the results happens right in the browser, using data already loaded, instead of asking the server again every time a filter or sort option changes.**

What we turned down: sending a fresh request to the server with the new filter or sort option every single time either one is changed.

Why: the backend does genuinely support filtering and sorting through the web address as well, and that was tested directly and works. But a single dealer group's full list of disagreements is small enough to comfortably hold in the browser all at once, so re-sorting or re-filtering what's already there is instant and skips a network trip this amount of data doesn't need.

---

**9. The three dataset files (the CSVs) are included directly in this repository, inside a folder named `DealerOS_Assignment_Dataset`.**

What we turned down: leaving the files out of the repository and instead writing instructions for where to manually place them after cloning.

Why: whether the project runs immediately after being cloned is a real and significant part of how this gets evaluated. Including the three files directly means that cloning the repository and running a handful of commands is genuinely the entire setup. Nothing needs to be separately found, downloaded, or copied into place by hand.
