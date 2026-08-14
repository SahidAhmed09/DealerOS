from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import filters, generics
from rest_framework.response import Response
from rest_framework.views import APIView

from reconciliation.models import Disagreement, Organization, SystemARecord, SystemBEntry
from reconciliation.serializers import DisagreementSerializer, OrganizationSerializer


class OrganizationListView(generics.ListAPIView):
    """So the frontend can offer an org switcher without hardcoding tenants."""

    queryset = Organization.objects.order_by("org_id")
    serializer_class = OrganizationSerializer


class DisagreementListView(generics.ListAPIView):
    """Disagreements for exactly one org, given in the URL.

    The org is a required path segment rather than an optional query param
    on purpose: there's no login here to derive a tenant from, and an
    optional filter is a filter someone can forget to apply. Making it part
    of the URL is what actually enforces "a row belonging to one tenant
    must never be visible to another" at the API boundary.
    """

    serializer_class = DisagreementSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["sort_value", "created_at"]
    ordering = ["-sort_value"]

    def get_queryset(self):
        org = get_object_or_404(Organization, org_id=self.kwargs["org_id"])
        queryset = Disagreement.objects.filter(organization=org).select_related(
            "organization", "location", "system_a_record"
        )
        reason = self.request.query_params.get("reason")
        if reason:
            queryset = queryset.filter(reason=reason)
        return queryset


class OrgSummaryView(APIView):
    """Coverage counts for one org: how many source records were actually
    imported and checked, not just how many disagreements came out the
    other end. Exists so "why are there only a few rows" has a visible
    answer inside the product, not just in conversation.
    """

    def get(self, request, org_id):
        org = get_object_or_404(Organization, org_id=org_id)

        a_count = SystemARecord.objects.filter(location__organization=org).count()

        # A System B entry counts under this org if it matched an A record
        # that belongs here, or - for orphan entries with no A record to
        # anchor to - if it claims a location that belongs here itself.
        b_count = SystemBEntry.objects.filter(
            Q(matched_record__location__organization=org)
            | Q(matched_record__isnull=True, location__organization=org)
        ).count()

        disagreement_count = Disagreement.objects.filter(organization=org).count()

        # Distinct, not a row count: one A record can carry more than one
        # disagreement reason (e.g. wrong value AND wrong date), and it
        # should only be subtracted once from "checked cleanly".
        flagged_a_record_count = (
            Disagreement.objects.filter(organization=org, system_a_record__isnull=False)
            .values("system_a_record_id")
            .distinct()
            .count()
        )

        return Response(
            {
                "org_id": org.org_id,
                "system_a_records_checked": a_count,
                "system_b_entries_checked": b_count,
                "disagreements_found": disagreement_count,
                "records_reconciled_cleanly": a_count - flagged_a_record_count,
            }
        )
