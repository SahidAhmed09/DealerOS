from django.urls import path

from reconciliation.views import DisagreementListView, OrganizationListView

urlpatterns = [
    path("orgs/", OrganizationListView.as_view(), name="org-list"),
    path("orgs/<str:org_id>/disagreements/", DisagreementListView.as_view(), name="disagreement-list"),
]
