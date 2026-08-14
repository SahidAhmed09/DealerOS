"""The actual comparison logic: decides where System A and System B
disagree. Kept separate from the management command and the API views so it
can be unit tested directly against small fixtures, without touching a CSV
file or a real HTTP request.

Rebuilds the Disagreement table from scratch on every call — it's a derived
view over SystemARecord/SystemBEntry, not a second source of truth, so
there's nothing to "sync"; just recompute it.
"""

from reconciliation.models import Disagreement, SystemARecord, SystemBEntry


def _org_for_location(location):
    return location.organization if location else None


def _money(value):
    return "(missing)" if value is None else str(value)


def run_reconciliation():
    Disagreement.objects.all().delete()

    created = []
    created.extend(_check_system_a_records())
    created.extend(_check_orphan_b_entries())

    Disagreement.objects.bulk_create([d for d, _ in created])
    # bulk_create doesn't let us set M2M in the same call, so attach afterwards.
    for disagreement, b_entries in created:
        if b_entries:
            disagreement.system_b_entries.set(b_entries)

    return len(created)


def _check_system_a_records():
    results = []
    records = SystemARecord.objects.select_related(
        "location", "location__organization"
    ).prefetch_related("b_entries")

    for a in records:
        b_entries = list(a.b_entries.all())
        org = _org_for_location(a.location)

        if len(b_entries) == 0:
            results.append((
                Disagreement(
                    reason=Disagreement.Reason.MISSING_IN_B,
                    organization=org,
                    location=a.location,
                    system_a_record=a,
                    a_value=_money(a.total_value),
                    b_value="(no entry)",
                    sort_value=a.total_value,
                    detail=f"{a.record_id} exists in System A with no matching entry in System B.",
                ),
                [],
            ))
            continue

        if len(b_entries) > 1:
            if _is_reconciling_split(a, b_entries):
                # Non-error: System B logged the same record as multiple
                # entries whose values sum to A's total (e.g. a part-1/part-2
                # split). That's not a disagreement, so no row is created.
                continue

            b_summary = ", ".join(f"{e.entry_id}={_money(e.parsed_value)}" for e in b_entries)
            results.append((
                Disagreement(
                    reason=Disagreement.Reason.DUPLICATE_ENTRY,
                    organization=org,
                    location=a.location,
                    system_a_record=a,
                    a_value=_money(a.total_value),
                    b_value=b_summary,
                    sort_value=a.total_value,
                    detail=(
                        f"{a.record_id} has {len(b_entries)} entries in System B "
                        f"({b_summary}) against a single System A total of "
                        f"{_money(a.total_value)} - this isn't a clean split, so it's "
                        f"flagged as a duplicate/inconsistent entry rather than reconciled."
                    ),
                ),
                b_entries,
            ))
            continue

        # Exactly one matching B entry: compare field by field. A record can
        # end up with more than one Disagreement row here (e.g. value AND
        # date both wrong) — each reason is reported separately so "filter
        # by reason" stays meaningful.
        b = b_entries[0]

        values_agree = (
            a.total_value is not None
            and b.parsed_value is not None
            and a.total_value == b.parsed_value
        )
        if not values_agree:
            results.append((
                Disagreement(
                    reason=Disagreement.Reason.VALUE_MISMATCH,
                    organization=org,
                    location=a.location,
                    system_a_record=a,
                    a_value=_money(a.total_value),
                    b_value=_money(b.parsed_value),
                    sort_value=a.total_value if a.total_value is not None else b.parsed_value,
                    detail=f"System A reports {_money(a.total_value)}, System B ({b.entry_id}) reports {_money(b.parsed_value)}.",
                ),
                [b],
            ))

        if a.event_date and b.recorded_on and a.event_date != b.recorded_on:
            results.append((
                Disagreement(
                    reason=Disagreement.Reason.DATE_MISMATCH,
                    organization=org,
                    location=a.location,
                    system_a_record=a,
                    a_value=str(a.event_date),
                    b_value=str(b.recorded_on),
                    sort_value=a.total_value,
                    detail=f"System A dates this {a.event_date}, System B ({b.entry_id}) dates it {b.recorded_on}.",
                ),
                [b],
            ))

        # Deliberately compared using A's location as the anchor, never B's —
        # this is what stops a mismatched record (e.g. REC-1077) from ever
        # being scoped to the wrong org. See DECISIONS.md.
        if a.location_id and b.location_id and a.location_id != b.location_id:
            results.append((
                Disagreement(
                    reason=Disagreement.Reason.LOCATION_MISMATCH,
                    organization=org,
                    location=a.location,
                    system_a_record=a,
                    a_value=a.location.location_id,
                    b_value=b.location.location_id if b.location else b.raw_location_id,
                    sort_value=a.total_value,
                    detail=(
                        f"System A files {a.record_id} under {a.location.location_id} "
                        f"({org}), System B ({b.entry_id}) claims {b.raw_location_id}. "
                        f"Filed under System A's org so it cannot leak to the other tenant."
                    ),
                ),
                [b],
            ))

    return results


def _is_reconciling_split(a_record, b_entries):
    """True when 2+ B entries for the same record don't individually match
    A's total, but DO sum to it — the "non-error" case (e.g. REC-1055),
    distinct from a genuine duplicate (e.g. REC-1042, where both entries
    already equal the total on their own)."""
    if a_record.total_value is None:
        return False
    values = [e.parsed_value for e in b_entries]
    if any(v is None for v in values):
        return False
    return sum(values) == a_record.total_value


def _check_orphan_b_entries():
    results = []
    orphans = SystemBEntry.objects.filter(matched_record__isnull=True).select_related(
        "location", "location__organization"
    )
    for b in orphans:
        org = _org_for_location(b.location)
        results.append((
            Disagreement(
                reason=Disagreement.Reason.ORPHAN_ENTRY,
                organization=org,
                location=b.location,
                system_a_record=None,
                a_value="(no such record)",
                b_value=f"{b.entry_id} -> {b.normalized_record_ref or b.raw_record_ref}",
                sort_value=b.parsed_value,
                detail=(
                    f"{b.entry_id} references {b.raw_record_ref!r} "
                    f"(normalized to {b.normalized_record_ref or '?'}), "
                    f"which does not exist in System A."
                ),
            ),
            [b],
        ))
    return results
