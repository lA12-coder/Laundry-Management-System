from django.db import transaction
from django.db.models import Count, Q, Sum, Value, DecimalField, F
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.contrib.auth import get_user_model

from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from core.permissions import IsStaffAdminRole
from partners.models import LaundryPartner
from .models import Order, TransactionLog, AdminActionLog, PriceList
from .serializers import (
    OrderListSerializer,
    OrderStatusOverrideSerializer,
    OrderReassignRiderSerializer,
    TransactionLogSerializer,
    AdminActionLogSerializer,
    PriceListSerializer,
)
from .services import calculate_order_price, build_cloth_items, assign_least_loaded_rider

User = get_user_model()

class OrderViewSet(viewsets.ModelViewSet):
    """
    Handles Order creation for both registered and guest (Ghost) users.
    Used primarily by Riders and Customers.
    """
    serializer_class = OrderListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Optimize for the current user's role
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return Order.objects.all()
        elif user.role == User.Role.RIDER:
            return Order.objects.filter(rider=user)
        return Order.objects.filter(customer=user)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        customer_phone = data.get('customer_phone')
        customer_name = data.get('customer_name', 'Guest Customer')
        customer_address = data.get('delivery_address') 

        if not customer_address:
            return Response(
                {"error": "Customer address is required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if not customer_phone:
            return Response(
                {"error": "Customer phone number is required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Automatically create or retrieve the user based on phone number
            customer_user, created = User.objects.get_or_create(
                phone_number=customer_phone,
                defaults={
                    'full_name': customer_name,
                    'username': customer_phone,
                    'role': User.Role.CUSTOMER,
                    'is_active': False,
                    'home_address': customer_address,
                }
            )

            if created:
                customer_user.set_unusable_password()
                customer_user.save()

            data['customer'] = customer_user.pk

            items = data.get('items', [])
            is_urgent = data.get('urgency') == Order.Urgency.URGENT

            # Look up real prices from PriceList — returns (total_amount, base_price)
            try:
                total_amount, base_price = calculate_order_price(items, is_urgent)
            except ValueError as exc:
                return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

            data['total_amount'] = total_amount
            data['base_price'] = base_price

            # Auto-assign least-loaded rider if none specified
            if not data.get('rider'):
                available_riders = User.objects.filter(role=User.Role.RIDER, is_active=True)
                assigned_rider = assign_least_loaded_rider(available_riders)
                if assigned_rider:
                    data['rider'] = assigned_rider.pk

            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            order = serializer.save(total_amount=total_amount, base_price=base_price)

            # Bulk-create ClothItem rows with snapshotted prices
            entry_ids = [item.get('price_list_entry_id') for item in items if item.get('price_list_entry_id')]
            price_map = {e.pk: e for e in PriceList.objects.filter(pk__in=entry_ids, is_active=True)}
            build_cloth_items(order, items, price_map)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class OrderManagementViewSet(viewsets.ModelViewSet):
    """
    Administrative control panel for managing laundry lifecycle.
    """
    serializer_class = OrderListSerializer
    permission_classes = [IsStaffAdminRole]

    def get_queryset(self):
        queryset = (
            Order.objects.select_related("customer", "partner", "rider")
            .prefetch_related("admin_action_logs")
            .all()
        )
        # Advanced Filtering for Dashboard
        status_param = self.request.query_params.get("status")
        partner_param = self.request.query_params.get("partner")
        
        if status_param:
            queryset = queryset.filter(status=status_param)
        if partner_param:
            queryset = queryset.filter(partner_id=partner_param)
            
        return queryset

    @action(methods=["post"], detail=True, url_path="override-status")
    def override_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        previous_status = order.status
        order.status = serializer.validated_data["status"]
        
        # Track timeline updates
        update_fields = ["status"]
        if order.status == Order.Status.DELIVERED:
            order.delivered_at = timezone.now()
            update_fields.append("delivered_at")

        order.save(update_fields=update_fields)

        AdminActionLog.objects.create(
            admin_user=request.user,
            order=order,
            action=AdminActionLog.Action.OVERRIDE_STATUS,
            previous_value=previous_status,
            new_value=order.status
        )
        return Response(OrderListSerializer(order).data)

    @action(methods=["post"], detail=True, url_path="reassign-rider")
    def reassign_rider(self, request, pk=None):
        order = self.get_object()
        serializer = OrderReassignRiderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        previous_rider = str(order.rider)
        order.rider = serializer.validated_data["rider"]
        order.save(update_fields=["rider"])

        AdminActionLog.objects.create(
            admin_user=request.user,
            order=order,
            action=AdminActionLog.Action.REASSIGN_RIDER,
            previous_value=previous_rider,
            new_value=str(order.rider)
        )
        return Response(OrderListSerializer(order).data)


class DashboardMetricsViewSet(viewsets.ViewSet):
    """
    Provides real-time stats for the React Admin Panel.
    """
    permission_classes = [IsStaffAdminRole]

    def list(self, request):
        active_statuses = [Order.Status.PENDING, Order.Status.PICKED_UP, Order.Status.WASHING]

        # Aggregate global metrics
        metrics = Order.objects.aggregate(
            total_revenue=Coalesce(Sum("total_amount"), Value(0, output_field=DecimalField())),
            total_orders=Count("id"),
            total_profit=Coalesce(Sum(F("total_amount") - F("base_price")), Value(0, output_field=DecimalField())),
            active_orders=Count("id", filter=Q(status__in=active_statuses)),
            pending_pickups=Count("id", filter=Q(status=Order.Status.PENDING)),
        )

        # Partner performance leaderboard
        partner_performance = (
            LaundryPartner.objects.annotate(
                completed_count=Count("orders", filter=Q(orders__status=Order.Status.DELIVERED)),
                total_earnings=Coalesce(Sum("orders__base_price"), Value(0, output_field=DecimalField()))
            )
            .values("business_name", "completed_count", "total_earnings", "capacity_per_day")
            .order_by("-completed_count")[:5]
        )

        return Response({
            "metrics": metrics,
            "top_partners": list(partner_performance)
        })


class FinancialTransactionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = TransactionLogSerializer
    permission_classes = [IsStaffAdminRole]
    queryset = TransactionLog.objects.select_related("order", "order__partner").all()


class AdminActionLogViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = AdminActionLogSerializer
    permission_classes = [IsStaffAdminRole]
    queryset = AdminActionLog.objects.select_related("admin_user", "order").all()


class PriceListViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD endpoint for the price catalogue.
    GET  /api/price-list/          — list active prices (public, for order form)
    POST /api/price-list/          — create new entry  (admin only)
    PATCH /api/price-list/{id}/    — update price      (admin only)
    DELETE /api/price-list/{id}/   — deactivate entry  (admin only)
    """
    serializer_class = PriceListSerializer

    def get_permissions(self):
        """Anyone can read the catalogue; only admins can mutate it."""
        if self.action in ["list", "retrieve"]:
            return []
        return [IsStaffAdminRole()]

    def get_queryset(self):
        qs = PriceList.objects.all().order_by("cloth_name", "size")
        # Non-admin users only see active entries
        if not (self.request.user and self.request.user.is_authenticated
                and getattr(self.request.user, 'role', None) == User.Role.ADMIN):
            qs = qs.filter(is_active=True)
        return qs

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: deactivate instead of hard-delete to preserve historical ClothItems."""
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)