import csv
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from reconciliation.models import Location, Organization, SystemARecord, SystemBEntry
from reconciliation.utils import normalize_record_ref, parse_money

DEFAULT_DATA_DIR = Path(settings.BASE_DIR).parent / "DealerOS_Assignment_Dataset"


def parse_date(raw_date):
    """Returns a date or None — never raises. A bad date must not stop the
    row from being imported."""
    if not raw_date or not raw_date.strip():
        return None
    try:
        return datetime.strptime(raw_date.strip(), "%Y-%m-%d").date()
    except ValueError:
        return None


class Command(BaseCommand):
    help = "Import locations.csv, system_a.csv and system_b.csv into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            default=str(DEFAULT_DATA_DIR),
            help="Directory containing locations.csv, system_a.csv, system_b.csv",
        )

    def handle(self, *args, **options):
        data_dir = Path(options["path"])
        self.warnings = []

        self.import_locations(data_dir / "locations.csv")
        a_count = self.import_system_a(data_dir / "system_a.csv")
        b_count = self.import_system_b(data_dir / "system_b.csv")

        self.stdout.write(self.style.SUCCESS(
            f"Imported {a_count} System A records and {b_count} System B entries."
        ))
        if self.warnings:
            self.stdout.write(self.style.WARNING(
                f"{len(self.warnings)} row(s) imported with something dirty (see below) "
                f"- nothing was dropped, just flagged:"
            ))
            for w in self.warnings:
                self.stdout.write(self.style.WARNING(f"  - {w}"))

    def import_locations(self, path):
        with open(path, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                org, _ = Organization.objects.get_or_create(org_id=row["org_id"].strip())
                Location.objects.update_or_create(
                    location_id=row["location_id"].strip(),
                    defaults={
                        "organization": org,
                        "name": row["location_name"].strip(),
                    },
                )

    def import_system_a(self, path):
        count = 0
        with open(path, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                record_id = row["record_id"].strip()
                location = Location.objects.filter(location_id=row["location_id"].strip()).first()
                if location is None:
                    self.warnings.append(
                        f"System A {record_id}: unknown location_id "
                        f"{row['location_id']!r}, imported with no location"
                    )

                event_date = parse_date(row["event_date"])
                if event_date is None and row["event_date"].strip():
                    self.warnings.append(f"System A {record_id}: unparseable event_date {row['event_date']!r}")

                actor_id = row["actor_id"].strip() or None
                if not actor_id:
                    self.warnings.append(f"System A {record_id}: blank actor_id")

                base_value = parse_money(row["base_value"])
                adjustment = parse_money(row["adjustment"])
                total_value = parse_money(row["total_value"])
                for field_name, raw, parsed in (
                    ("base_value", row["base_value"], base_value),
                    ("adjustment", row["adjustment"], adjustment),
                    ("total_value", row["total_value"], total_value),
                ):
                    if parsed is None and raw.strip():
                        self.warnings.append(f"System A {record_id}: unparseable {field_name} {raw!r}")

                SystemARecord.objects.update_or_create(
                    record_id=record_id,
                    defaults={
                        "location": location,
                        "event_date": event_date,
                        "category_code": row["category_code"].strip(),
                        "actor_id": actor_id,
                        "base_value": base_value,
                        "adjustment": adjustment,
                        "total_value": total_value,
                        "state": row["state"].strip(),
                    },
                )
                count += 1
        return count

    def import_system_b(self, path):
        count = 0
        with open(path, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                entry_id = row["entry_id"].strip()
                raw_ref = row["record_ref"]
                normalized_ref = normalize_record_ref(raw_ref)
                matched_record = None
                if normalized_ref:
                    matched_record = SystemARecord.objects.filter(record_id=normalized_ref).first()
                if not normalized_ref:
                    self.warnings.append(f"System B {entry_id}: unreadable record_ref {raw_ref!r}")
                elif matched_record is None:
                    self.warnings.append(
                        f"System B {entry_id}: record_ref {raw_ref!r} normalizes to "
                        f"{normalized_ref!r}, which does not exist in System A (orphan entry)"
                    )

                raw_location_id = row["location_id"].strip()
                location = Location.objects.filter(location_id=raw_location_id).first()
                if location is None and raw_location_id:
                    self.warnings.append(f"System B {entry_id}: unknown location_id {raw_location_id!r}")

                recorded_on = parse_date(row["recorded_on"])

                raw_value = row["value"]
                parsed_value = parse_money(raw_value)
                if parsed_value is None:
                    self.warnings.append(f"System B {entry_id}: value is blank or unparseable ({raw_value!r})")

                SystemBEntry.objects.update_or_create(
                    entry_id=entry_id,
                    defaults={
                        "raw_record_ref": raw_ref,
                        "normalized_record_ref": normalized_ref or "",
                        "matched_record": matched_record,
                        "raw_location_id": raw_location_id,
                        "location": location,
                        "recorded_on": recorded_on,
                        "raw_value": raw_value,
                        "parsed_value": parsed_value,
                        "label": row["label"].strip(),
                    },
                )
                count += 1
        return count
