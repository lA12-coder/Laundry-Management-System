from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsStaffAdminRole
from orders.models import Order, AdminActionLog
from .models import LaundryPartner
from .serializers import LaundryPartnerSerializer

class PartnerOversightViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = LaundryPartnerSerializer
    permission_classes = [IsStaffAdminRole]

    def get_queryset(self):
        return LaundryPartner.objects.select_related("owner").annotate(
            current_load=Count(
                "orders",
                filter=Q(
                    orders__status__in=[
                        Order.Status.PENDING,
                        Order.Status.PICKED_UP,
                        Order.Status.WASHING,
                    ]
                ),
            ),
            pending_orders=Count("orders", filter=Q(orders__status=Order.Status.PENDING)),
            payout_total=Coalesce(Sum("orders__partner_earning"), 0),
        )

    @action(methods=["post"], detail=True, url_path="approve")
    def approve(self, request, pk=None):
        partner = self.get_object()
        partner.is_approved = True
        partner.is_active = True
        partner.save(update_fields=["is_approved", "is_active", "updated_at"])

        AdminActionLog.objects.create(
            admin_user=request.user,
            action=AdminActionLog.Action.PARTNER_APPROVAL,
            previous_value="unapproved",
            new_value="approved",
            metadata={"partner_id": partner.id, "source": "api"},
        )
        return Response(self.get_serializer(partner).data)

    @action(methods=["post"], detail=True, url_path="deactivate")
    def deactivate(self, request, pk=None):
        partner = self.get_object()
        partner.is_active = False
        partner.save(update_fields=["is_active", "updated_at"])

        AdminActionLog.objects.create(
            admin_user=request.user,
            action=AdminActionLog.Action.PARTNER_DEACTIVATION,
            previous_value="active",
            new_value="inactive",
            metadata={"partner_id": partner.id, "source": "api"},
        )
        return Response(self.get_serializer(partner).data)
