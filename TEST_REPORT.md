# Test Report

Generated 2026-08-14, from a database rebuilt from scratch (`db.sqlite3` deleted, then `migrate`, `import_data`, `reconcile` run fresh) so every number below reflects a real run, not a cached one. This satisfies the brief's testing requirement directly:

> Write tests for the comparison logic. Not for everything, just for the part where the disagreements are decided. For each kind of disagreement you catch, one test that proves you catch it.

## 1. Test suite result

```
python manage.py test reconciliation -v 2
```

**Result: 24 of 24 tests passed. 0 failures, 0 errors.**

Full test names, verbatim from the run:

```
test_different_date_is_flagged_independently_of_value ... ok
test_split_entries_summing_to_the_total_are_not_a_disagreement ... ok
test_two_entries_that_neither_match_nor_sum_are_flagged ... ok
test_two_identical_entries_are_flagged_as_a_true_duplicate ... ok
test_a_conflicting_record_never_appears_in_the_other_orgs_results ... ok
test_location_conflict_is_flagged_and_filed_under_system_as_org ... ok
test_a_record_with_no_b_entry_is_flagged ... ok
test_perfectly_matching_record_produces_no_disagreement ... ok
test_b_entry_pointing_at_nonexistent_record_is_flagged ... ok
test_blank_b_value_counts_as_a_mismatch ... ok
test_different_value_is_flagged ... ok
test_bare_number_missing_prefix ... ok
test_clean_reference ... ok
test_lowercase_no_dash ... ok
test_no_digits_returns_none ... ok
test_none_input_returns_none ... ok
test_stray_whitespace_around_dash ... ok
test_blank_string_is_none ... ok
test_garbage_is_none_not_a_crash ... ok
test_indian_lakh_style_grouping ... ok
test_none_is_none ... ok
test_plain_number ... ok
test_us_style_grouping ... ok
test_whitespace_only_is_none ... ok

Ran 24 tests in 0.026s
OK
```

## 2. Coverage against the brief's requirement, one test per disagreement type

| Required disagreement type | Test that proves it | Result |
|---|---|---|
| A record in System A with no entry in System B | `test_a_record_with_no_b_entry_is_flagged` | pass |
| A System B entry pointing at a record that doesn't exist | `test_b_entry_pointing_at_nonexistent_record_is_flagged` | pass |
| The same record entered into System B twice | `test_two_identical_entries_are_flagged_as_a_true_duplicate` | pass |
| The two systems reporting different values | `test_different_value_is_flagged` | pass |

All four required types are covered. Plus, the edge cases that are easy to get wrong:

| Extra case | Test | Result |
|---|---|---|
| A record with two B entries that don't sum correctly (still a duplicate) | `test_two_entries_that_neither_match_nor_sum_are_flagged` | pass |
| A record with two B entries that DO sum correctly (not an error) | `test_split_entries_summing_to_the_total_are_not_a_disagreement` | pass |
| A blank value on the B side (not silently ignored) | `test_blank_b_value_counts_as_a_mismatch` | pass |
| A date mismatch, independent of value | `test_different_date_is_flagged_independently_of_value` | pass |
| A location mismatch, filed under the correct org | `test_location_conflict_is_flagged_and_filed_under_system_as_org` | pass |
| The same location-conflicted record never leaking to the other org | `test_a_conflicting_record_never_appears_in_the_other_orgs_results` | pass |
| A perfectly matching record produces zero disagreements | `test_perfectly_matching_record_produces_no_disagreement` | pass |

`test_utils.py`'s 10 tests cover the parsing helpers separately (all four dirty `record_ref` spellings, both currency-grouping styles, blank and garbage input), not counted above since they're not disagreement-type tests, but they're part of the 24.

## 3. The actual results, run against the real dataset

Import and reconcile output from this exact run:

```
Imported 120 System A records and 121 System B entries.
3 row(s) imported with something dirty (see below) - nothing was dropped, just flagged:
  - System A REC-1050: blank actor_id
  - System B ENT/2026/4050: value is blank or unparseable ('')
  - System B ENT/2026/4901: record_ref 'REC-1999' normalizes to 'REC-1999', which does not exist in System A (orphan entry)
Found 11 disagreement(s):
  DATE_MISMATCH: 1
  DUPLICATE_ENTRY: 1
  LOCATION_MISMATCH: 1
  MISSING_IN_B: 2
  ORPHAN_ENTRY: 1
  VALUE_MISMATCH: 5
```

### Coverage per org

| Org | System A records checked | System B entries checked | Reconciled cleanly | Disagreements found |
|---|---|---|---|---|
| ORG-A | 74 | 76 | 68 | 7 |
| ORG-B | 46 | 45 | 42 | 4 |
| **Total** | **120** | **121** | **110** | **11** |

120 and 121 match the row counts of `system_a.csv` and `system_b.csv` exactly. Nothing was dropped during import.

### Every disagreement entry, in full

**ORG-A (7):**

| Reason | Record | Location | System A | System B | Logged |
|---|---|---|---|---|---|
| VALUE_MISMATCH | REC-1064 | LOC-101 | 183244.16 | 125400.00 | 2026-08-14 |
| VALUE_MISMATCH | REC-1088 | LOC-103 | 138948.30 | 108553.36 | 2026-08-14 |
| DUPLICATE_ENTRY | REC-1042 | LOC-101 | 112837.06 | ENT/2026/4042=112837.06, ENT/2026/4902=112837.06 | 2026-08-14 |
| LOCATION_MISMATCH | REC-1077 | LOC-102 | LOC-102 | LOC-201 | 2026-08-14 |
| VALUE_MISMATCH | REC-1027 | LOC-102 | 79259.03 | 61921.12 | 2026-08-14 |
| ORPHAN_ENTRY | (none, no A record) | LOC-102 | (no such record) | ENT/2026/4901 -> REC-1999 | 2026-08-14 |
| MISSING_IN_B | REC-1015 | LOC-103 | 41095.33 | (no entry) | 2026-08-14 |

**ORG-B (4):**

| Reason | Record | Location | System A | System B | Logged |
|---|---|---|---|---|---|
| VALUE_MISMATCH | REC-1003 | LOC-202 | 121388.01 | 94834.38 | 2026-08-14 |
| VALUE_MISMATCH | REC-1050 | LOC-202 | 160405.85 | (missing) | 2026-08-14 |
| DATE_MISMATCH | REC-1009 | LOC-201 | 2026-03-31 | 2026-04-02 | 2026-08-14 |
| MISSING_IN_B | REC-1061 | LOC-202 | 87615.49 | (no entry) | 2026-08-14 |

Cross-checked against the manual catalogue of every anomaly found by directly reading the raw CSVs at the start of this project: 11 for 11, no extras, none missing.

## 4. What this report does not cover

Named honestly, so nothing here reads as more complete than it is:

- The frontend has no automated tests. Its behavior was checked manually (see `README.md`'s reflection answers).
- `OrgSummaryView` (the coverage-count endpoint behind section 3's per-org table above) has no dedicated automated test either, its correctness was verified by hand against this same manual catalogue, the same way this whole report was built.
- This report is a point-in-time snapshot. Re-running the three commands in section 1 and 3 will regenerate it; it isn't wired into CI or re-run automatically.
