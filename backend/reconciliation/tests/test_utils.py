from decimal import Decimal

from django.test import SimpleTestCase

from reconciliation.utils import normalize_record_ref, parse_money


class NormalizeRecordRefTests(SimpleTestCase):
    """Exercises the four record_ref spellings actually found in system_b.csv."""

    def test_clean_reference(self):
        self.assertEqual(normalize_record_ref("REC-1042"), "REC-1042")

    def test_lowercase_no_dash(self):
        self.assertEqual(normalize_record_ref("rec1034"), "REC-1034")

    def test_stray_whitespace_around_dash(self):
        self.assertEqual(normalize_record_ref(" REC - 1070 "), "REC-1070")

    def test_bare_number_missing_prefix(self):
        self.assertEqual(normalize_record_ref("1112"), "REC-1112")

    def test_no_digits_returns_none(self):
        self.assertIsNone(normalize_record_ref("nonsense"))

    def test_none_input_returns_none(self):
        self.assertIsNone(normalize_record_ref(None))


class ParseMoneyTests(SimpleTestCase):
    def test_plain_number(self):
        self.assertEqual(parse_money("94834.38"), Decimal("94834.38"))

    def test_us_style_grouping(self):
        self.assertEqual(parse_money("125,400.00"), Decimal("125400.00"))

    def test_indian_lakh_style_grouping(self):
        # The exact value found in system_b.csv for REC-1064.
        self.assertEqual(parse_money("1,25,400.00"), Decimal("125400.00"))

    def test_blank_string_is_none(self):
        self.assertIsNone(parse_money(""))

    def test_whitespace_only_is_none(self):
        self.assertIsNone(parse_money("   "))

    def test_none_is_none(self):
        self.assertIsNone(parse_money(None))

    def test_garbage_is_none_not_a_crash(self):
        self.assertIsNone(parse_money("not-a-number"))
