from django.db import models


class Organization(models.Model):
    """A dealer group. The only source of org membership is locations.csv,
    via Location.organization below — orgs never appear directly in
    system_a.csv or system_b.csv."""

    org_id = models.CharField(max_length=32, unique=True)

    def __str__(self):
        return self.org_id


class Location(models.Model):
    """A dealership branch. Belongs to exactly one org (locations.csv is the
    only place that mapping exists, per the brief)."""

    location_id = models.CharField(max_length=32, unique=True)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="locations"
    )
    name = models.CharField(max_length=128, blank=True)

    def __str__(self):
        return self.location_id


class SystemARecord(models.Model):
    """One row from system_a.csv, as System A recorded it. record_id is the
    identifier every System B entry refers back to."""

    STATE_CHOICES = [
        ("CONFIRMED", "Confirmed"),
        ("VOIDED", "Voided"),
    ]

    record_id = models.CharField(max_length=32, unique=True)
    location = models.ForeignKey(
        Location, on_delete=models.PROTECT, related_name="a_records", null=True
    )
    event_date = models.DateField(null=True)
    category_code = models.CharField(max_length=16, blank=True)
    # Blank in the source for at least one row (REC-1050) — must import cleanly.
    actor_id = models.CharField(max_length=16, blank=True, null=True)
    base_value = models.DecimalField(max_digits=14, decimal_places=2, null=True)
    adjustment = models.DecimalField(max_digits=14, decimal_places=2, null=True)
    total_value = models.DecimalField(max_digits=14, decimal_places=2, null=True)
    state = models.CharField(max_length=16, choices=STATE_CHOICES, blank=True)

    def __str__(self):
        return self.record_id


class SystemBEntry(models.Model):
    """One row from system_b.csv, as System B recorded it. record_ref points
    back at a SystemARecord but is frequently dirty (wrong case, stray
    spaces/dashes, missing prefix, or pointing at nothing at all), so both
    the raw and normalized ref are kept. There can be more than one entry
    per record_ref."""

    entry_id = models.CharField(max_length=32, unique=True)

    # Exactly what the CSV said, untouched — needed so a bad value never
    # just silently disappears during import.
    raw_record_ref = models.CharField(max_length=64)
    normalized_record_ref = models.CharField(max_length=32, db_index=True)
    matched_record = models.ForeignKey(
        SystemARecord,
        on_delete=models.SET_NULL,
        related_name="b_entries",
        null=True,
        blank=True,
    )

    raw_location_id = models.CharField(max_length=32, blank=True)
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        related_name="b_entries",
        null=True,
        blank=True,
    )

    recorded_on = models.DateField(null=True)

    # value can be blank or garbled (e.g. "1,25,400.00"); raw_value keeps the
    # original string, parsed_value is the best-effort numeric reading of it.
    raw_value = models.CharField(max_length=32, blank=True)
    parsed_value = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )

    label = models.CharField(max_length=128, blank=True)

    def __str__(self):
        return self.entry_id


class Disagreement(models.Model):
    """One reconciled discrepancy between System A and System B. Rebuilt from
    scratch each time the reconcile command runs — this table is a derived
    view, not a second source of truth."""

    class Reason(models.TextChoices):
        MISSING_IN_B = "MISSING_IN_B", "In System A, no entry in System B"
        ORPHAN_ENTRY = "ORPHAN_ENTRY", "System B entry references a record that does not exist"
        DUPLICATE_ENTRY = "DUPLICATE_ENTRY", "Same record entered into System B twice"
        VALUE_MISMATCH = "VALUE_MISMATCH", "Systems report different values"
        DATE_MISMATCH = "DATE_MISMATCH", "Systems report different dates"
        LOCATION_MISMATCH = "LOCATION_MISMATCH", "Systems disagree on the location"

    reason = models.CharField(max_length=32, choices=Reason.choices, db_index=True)

    # Derived from System A's location ONLY, never System B's — this is what
    # keeps a record like REC-1077 (A says org A's branch, B says org B's)
    # from ever leaking into the wrong org's results. See DECISIONS.md.
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="disagreements", null=True
    )
    location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, related_name="disagreements", null=True
    )

    system_a_record = models.ForeignKey(
        SystemARecord, on_delete=models.CASCADE, related_name="disagreements", null=True, blank=True
    )
    system_b_entries = models.ManyToManyField(SystemBEntry, related_name="disagreements", blank=True)

    a_value = models.CharField(max_length=128, blank=True)
    b_value = models.CharField(max_length=128, blank=True)
    # Best-effort numeric reading of whichever side has a usable number, so
    # the UI can sort "by value" without trying to sort display strings.
    sort_value = models.DecimalField(max_digits=14, decimal_places=2, null=True)

    detail = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-sort_value"]

    def __str__(self):
        return f"{self.reason}: {self.system_a_record_id or '(no A record)'}"
