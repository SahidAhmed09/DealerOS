from rest_framework import serializers

from reconciliation.models import Disagreement, Organization


class DisagreementSerializer(serializers.ModelSerializer):
    reason_display = serializers.CharField(source="get_reason_display", read_only=True)
    organization = serializers.CharField(source="organization.org_id", default=None, read_only=True)
    location = serializers.CharField(source="location.location_id", default=None, read_only=True)
    record_id = serializers.CharField(source="system_a_record.record_id", default=None, read_only=True)

    class Meta:
        model = Disagreement
        fields = [
            "id",
            "reason",
            "reason_display",
            "organization",
            "location",
            "record_id",
            "a_value",
            "b_value",
            "sort_value",
            "detail",
            "created_at",
        ]


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["org_id"]
