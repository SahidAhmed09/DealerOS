"""Shared parsing helpers for dirty CSV data. Kept separate from the
importer/reconciler so tests can exercise them directly against the exact
messy strings found in the dataset (rec1034, " REC - 1070 ", "1112",
"1,25,400.00", etc.) without needing a database or CSV file."""

import re
from decimal import Decimal, InvalidOperation


def normalize_record_ref(raw_ref):
    """Turn any of the observed record_ref spellings into the canonical
    "REC-<digits>" form used as System A's record_id.

    Handles, all seen in system_b.csv:
      "REC-1042"        -> "REC-1042"   (clean)
      "rec1034"         -> "REC-1034"   (lowercase, no dash)
      " REC - 1070 "    -> "REC-1070"   (stray whitespace around the dash)
      "1112"            -> "REC-1112"   (bare number, missing prefix)
    Returns None if there's no digit run to anchor on at all.
    """
    if raw_ref is None:
        return None
    match = re.search(r"(\d+)\s*$", raw_ref.strip())
    if not match:
        return None
    return f"REC-{match.group(1)}"


def parse_money(raw_value):
    """Parse a currency-ish string into a Decimal, or None if it's blank or
    not a number at all. Never raises — the importer must not crash on a bad
    value, just record that it couldn't be read.

    Strips thousands separators regardless of grouping style, so both
    "125,400.00" (US) and "1,25,400.00" (Indian lakh grouping) parse the
    same way: remove every comma, then parse what's left.
    """
    if raw_value is None:
        return None
    cleaned = raw_value.strip().replace(",", "")
    if cleaned == "":
        return None
    try:
        return Decimal(cleaned).quantize(Decimal("0.01"))
    except InvalidOperation:
        return None
