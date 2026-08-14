"""Tests for the actual disagreement-detection logic in services.py.

Uses small hand-built fixtures rather than the real CSVs, so each test
isolates exactly one behavior. Every disagreement type required by the
brief has its own test, plus the two edge cases that are easy to get wrong:
a "split" entry that looks like a duplicate but isn't (REC-1055 in the real
data), and a location conflict that must not leak a record into the wrong
org's results (REC-1077 in the real data).
"""

from decimal import Decimal

from django.test import TestCase

from reconciliation.models import Disagreement, Location, Organization, SystemARecord, SystemBEntry
from reconciliation.services import run_reconciliation


class ReconciliationTestCase(TestCase):
    def setUp(self):
        self.org_a = Organization.objects.create(org_id="ORG-A")
        self.org_b = Organization.objects.create(org_id="ORG-B")
        self.loc_a = Location.objects.create(location_id="LOC-101", organization=self.org_a, name="Branch 101")
        self.loc_b = Location.objects.create(location_id="LOC-201", organization=self.org_b, name="Branch 201")

    def make_a_record(self, record_id="REC-1", location=None, total_value="100.00", event_date="2026-03-01", **kwargs):
        return SystemARecord.objects.create(
            record_id=record_id,
            location=location or self.loc_a,
            event_date=event_date,
            category_code="CAT-01",
            actor_id="USR-1",
            base_value=Decimal("80.00"),
            adjustment=Decimal("20.00"),
            total_value=Decimal(total_value) if total_value is not None else None,
            state="CONFIRMED",
            **kwargs,
        )

    def make_b_entry(self, entry_id, record_ref, matched_record=None, location=None, value="100.00", recorded_on="2026-03-01"):
        return SystemBEntry.objects.create(
            entry_id=entry_id,
            raw_record_ref=record_ref,
            normalized_record_ref=record_ref,
            matched_record=matched_record,
            raw_location_id=(location or self.loc_a).location_id,
            location=location or self.loc_a,
            recorded_on=recorded_on,
            raw_value=value or "",
            parsed_value=Decimal(value) if value is not None else None,
            label="Entry",
        )


class NoDisagreementTests(ReconciliationTestCase):
    def test_perfectly_matching_record_produces_no_disagreement(self):
        a = self.make_a_record()
        self.make_b_entry("ENT-1", "REC-1", matched_record=a)

        run_reconciliation()

        self.assertEqual(Disagreement.objects.count(), 0)


class MissingInBTests(ReconciliationTestCase):
    def test_a_record_with_no_b_entry_is_flagged(self):
        self.make_a_record(record_id="REC-1015", total_value="41095.33")

        run_reconciliation()

        d = Disagreement.objects.get()
        self.assertEqual(d.reason, Disagreement.Reason.MISSING_IN_B)
        self.assertEqual(d.system_a_record.record_id, "REC-1015")
        self.assertEqual(d.b_value, "(no entry)")


class OrphanEntryTests(ReconciliationTestCase):
    def test_b_entry_pointing_at_nonexistent_record_is_flagged(self):
        # matched_record=None is exactly what the importer produces when
        # normalize_record_ref() can't find a matching SystemARecord.
        self.make_b_entry("ENT-999", "REC-1999", matched_record=None, value="41250.00")

        run_reconciliation()

        d = Disagreement.objects.get()
        self.assertEqual(d.reason, Disagreement.Reason.ORPHAN_ENTRY)
        self.assertIsNone(d.system_a_record)
        self.assertIn("REC-1999", d.b_value)


class DuplicateEntryTests(ReconciliationTestCase):
    def test_two_identical_entries_are_flagged_as_a_true_duplicate(self):
        a = self.make_a_record(record_id="REC-1042", total_value="112837.06")
        self.make_b_entry("ENT-A", "REC-1042", matched_record=a, value="112837.06")
        self.make_b_entry("ENT-B", "REC-1042", matched_record=a, value="112837.06")

        run_reconciliation()

        d = Disagreement.objects.get()
        self.assertEqual(d.reason, Disagreement.Reason.DUPLICATE_ENTRY)
        self.assertEqual(d.system_b_entries.count(), 2)

    def test_split_entries_summing_to_the_total_are_not_a_disagreement(self):
        # The non-error case: two B entries, neither matching A's total on
        # its own, but together they add up exactly - not a real conflict.
        a = self.make_a_record(record_id="REC-1055", total_value="179877.32")
        self.make_b_entry("ENT-A", "REC-1055", matched_record=a, value="71950.93")
        self.make_b_entry("ENT-B", "REC-1055", matched_record=a, value="107926.39")

        run_reconciliation()

        self.assertEqual(Disagreement.objects.count(), 0)

    def test_two_entries_that_neither_match_nor_sum_are_flagged(self):
        a = self.make_a_record(record_id="REC-9", total_value="500.00")
        self.make_b_entry("ENT-A", "REC-9", matched_record=a, value="100.00")
        self.make_b_entry("ENT-B", "REC-9", matched_record=a, value="200.00")

        run_reconciliation()

        d = Disagreement.objects.get()
        self.assertEqual(d.reason, Disagreement.Reason.DUPLICATE_ENTRY)


class ValueMismatchTests(ReconciliationTestCase):
    def test_different_value_is_flagged(self):
        a = self.make_a_record(record_id="REC-1003", total_value="121388.01")
        self.make_b_entry("ENT-1", "REC-1003", matched_record=a, value="94834.38")

        run_reconciliation()

        d = Disagreement.objects.get()
        self.assertEqual(d.reason, Disagreement.Reason.VALUE_MISMATCH)
        self.assertEqual(d.a_value, "121388.01")
        self.assertEqual(d.b_value, "94834.38")

    def test_blank_b_value_counts_as_a_mismatch(self):
        a = self.make_a_record(record_id="REC-1050", total_value="160405.85")
        self.make_b_entry("ENT-1", "REC-1050", matched_record=a, value=None)

        run_reconciliation()

        d = Disagreement.objects.get()
        self.assertEqual(d.reason, Disagreement.Reason.VALUE_MISMATCH)
        self.assertEqual(d.b_value, "(missing)")


class DateMismatchTests(ReconciliationTestCase):
    def test_different_date_is_flagged_independently_of_value(self):
        a = self.make_a_record(record_id="REC-1009", total_value="111699.30", event_date="2026-03-31")
        self.make_b_entry("ENT-1", "REC-1009", matched_record=a, value="111699.30", recorded_on="2026-04-02")

        run_reconciliation()

        d = Disagreement.objects.get()
        self.assertEqual(d.reason, Disagreement.Reason.DATE_MISMATCH)
        self.assertEqual(d.a_value, "2026-03-31")
        self.assertEqual(d.b_value, "2026-04-02")


class LocationMismatchAndTenantIsolationTests(ReconciliationTestCase):
    def test_location_conflict_is_flagged_and_filed_under_system_as_org(self):
        a = self.make_a_record(record_id="REC-1077", location=self.loc_a, total_value="83361.40")
        self.make_b_entry("ENT-1", "REC-1077", matched_record=a, location=self.loc_b, value="83361.40")

        run_reconciliation()

        d = Disagreement.objects.get()
        self.assertEqual(d.reason, Disagreement.Reason.LOCATION_MISMATCH)
        # Filed under Org A (System A's claim), not Org B (System B's claim).
        self.assertEqual(d.organization, self.org_a)

    def test_a_conflicting_record_never_appears_in_the_other_orgs_results(self):
        a = self.make_a_record(record_id="REC-1077", location=self.loc_a, total_value="83361.40")
        self.make_b_entry("ENT-1", "REC-1077", matched_record=a, location=self.loc_b, value="83361.40")

        run_reconciliation()

        org_b_results = Disagreement.objects.filter(organization=self.org_b)
        self.assertEqual(org_b_results.count(), 0)
