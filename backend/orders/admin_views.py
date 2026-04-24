from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import User
from core.permissions import IsStaffAdminRole
from partners.models import LaundryPartner
from .models import AdminActionLog, Order, TransactionLog
from .serializers import (
    AdminActionLogSerializer,
    OrderListSerializer,
    OrderReassignRiderSerializer,
    OrderStatusOverrideSerializer,
    TransactionLogSerializer,
)

class DashboardMetricsViewSet(viewsets.ViewSet):
    permission_classes = [IsStaffAdminRole]

    def list(self, request):
        orders_qs = Order.objects.select_related("partner", "rider")
        active_statuses = [Order.Status.PENDING, Order.Status.PICKED_UP, Order.Status.WASHING]

        metrics = orders_qs.aggregate(
            total_revenue=Coalesce(Sum("total_amount"), 0),
            active_orders=Count("id", filter=Q(status__in=active_statuses)),
            pending_pickups=Count("id", filter=Q(status=Order.Status.PENDING)),
        )

        partner_performance = (
            LaundryPartner.objects.annotate(
                completed_orders=Count(
                    "orders", filter=Q(orders__status=Order.Status.DELIVERED)
                ),
                total_partner_earnings=Coalesce(Sum("orders__partner_earning"), 0),
            )
            .values(
                "id",
                "business_name",
                "completed_orders",
                "total_partner_earnings",
                "capacity_per_day",
            )
            .order_by("-completed_orders")[:10]
        )

        rider_load = (
            User.objects.filter(role=User.Role.RIDER, is_active=True)
            .annotate(
                current_load=Count(
                    "rider_orders",
                    filter=Q(
                        rider_orders__status__in=[
                            Order.Status.PENDING,
                            Order.Status.PICKED_UP,
                            Order.Status.WASHING,
                        ]
                    ),
                )
            )
            .values("id", "email", "full_name", "current_load")
            .order_by("-current_load", "email")
        )

        return Response(
            {
                "total_revenue": metrics["total_revenue"],
                "active_orders": metrics["active_orders"],
                "pending_pickups": metrics["pending_pickups"],
                "partner_performance": list(partner_performance),
                "rider_load": list(rider_load),
            }
        )

class OrderManagementViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderListSerializer
    permission_classes = [IsStaffAdminRole]

    def get_queryset(self):
        queryset = (
            Order.objects.select_related("customer", "partner", "rider", "partner__owner")
            .prefetch_related("admin_action_logs")
            .all()
        )
        status_value = self.request.query_params.get("status")
        partner_id = self.request.query_params.get("partner")
        rider_id = self.request.query_params.get("rider")

        if status_value:
            queryset = queryset.filter(status=status_value)
        if partner_id:
            queryset = queryset.filter(partner_id=partner_id)
        if rider_id:
            queryset = queryset.filter(rider_id=rider_id)

        return queryset

    @action(methods=["post"], detail=True, url_path="override-status")
    def override_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        previous = order.status
        order.status = serializer.validated_data["status"]
        order.save(update_fields=["status", "picked_up_at", "delivered_at", "updated_at"])

        AdminActionLog.objects.create(
            admin_user=request.user,
            order=order,
            action=AdminActionLog.Action.OVERRIDE_STATUS,
            previous_value=previous,
            new_value=order.status,
            metadata={"source": "api"},
        )
        return Response(OrderListSerializer(order).data, status=status.HTTP_200_OK)

    @action(methods=["post"], detail=True, url_path="reassign-rider")
    def reassign_rider(self, request, pk=None):
        order = self.get_object()
        serializer = OrderReassignRiderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        previous_rider_id = order.rider_id
        order.rider = serializer.validated_data["rider"]
        order.save(update_fields=["rider", "updated_at"])

        AdminActionLog.objects.create(
            admin_user=request.user,
            order=order,
            action=AdminActionLog.Action.REASSIGN_RIDER,
            previous_value=str(previous_rider_id or ""),
            new_value=str(order.rider_id or ""),
            metadata={"source": "api"},
        )
        return Response(OrderListSerializer(order).data, status=status.HTTP_200_OK)

class FinancialTransactionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = TransactionLogSerializer
    permission_classes = [IsStaffAdminRole]

    def get_queryset(self):
        return TransactionLog.objects.select_related(
            "order",
            "order__partner",
            "order__rider",
        ).all()

class AdminActionLogViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = AdminActionLogSerializer
    permission_classes = [IsStaffAdminRole]

    def get_queryset(self):
        return AdminActionLog.objects.select_related("admin_user", "order").all()
