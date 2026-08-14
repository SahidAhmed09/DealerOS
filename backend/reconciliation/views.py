from django.shortcuts import get_object_or_404
from rest_framework import filters, generics

from reconciliation.models import Disagreement, Organization
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
