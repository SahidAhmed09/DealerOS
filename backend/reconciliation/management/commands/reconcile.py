from django.core.management.base import BaseCommand

from reconciliation.models import Disagreement
from reconciliation.services import run_reconciliation


class Command(BaseCommand):
    help = "Recompute the Disagreement table from the currently imported System A/B data."

    def handle(self, *args, **options):
        total = run_reconciliation()
        self.stdout.write(self.style.SUCCESS(f"Found {total} disagreement(s):"))
        counts = (
            Disagreement.objects.values("reason")
            .order_by("reason")
            .values_list("reason", flat=True)
        )
        from collections import Counter
        for reason, count in sorted(Counter(counts).items()):
            self.stdout.write(f"  {reason}: {count}")
