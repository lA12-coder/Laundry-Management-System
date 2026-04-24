
from django.contrib import admin
from .models import Order
from django.contrib import admin
from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce

from accounts.models import User
from .models import AdminActionLog, Order, TransactionLog


class AdminRoleRestrictedMixin:
    def _is_admin_role(self, request):
        return request.user.is_authenticated and request.user.is_staff and request.user.role == User.Role.ADMIN

    def has_module_permission(self, request):
        return self._is_admin_role(request)

    def has_view_permission(self, request, obj=None):
        return self._is_admin_role(request)

    def has_change_permission(self, request, obj=None):
        return self._is_admin_role(request)


@admin.register(Order)
class OrderAdmin(AdminRoleRestrictedMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "status",
        "customer",
        "partner",
        "rider",
        "total_amount",
        "updated_at",
    )
    
    list_filter = ("status", "partner", "rider")
    search_fields = ("id", "customer__email", "partner__business_name", "rider__email")
    autocomplete_fields = ("customer", "partner", "rider")
    change_list_template = "admin/orders/order/change_list.html"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "customer", "partner", "rider", "partner__owner"
        )

    def changelist_view(self, request, extra_context=None):
        queryset = self.get_queryset(request)
        active_statuses = [Order.Status.PENDING, Order.Status.PICKED_UP, Order.Status.WASHING]

        metrics = queryset.aggregate(
            total_revenue=Coalesce(Sum("total_amount"), 0),
            active_orders=Count("id", filter=Q(status__in=active_statuses)),
            pending_pickups=Count("id", filter=Q(status=Order.Status.PENDING)),
        )
        partner_performance = (
            queryset.values("partner__business_name")
            .annotate(
                completed_orders=Count("id", filter=Q(status=Order.Status.DELIVERED)),
                earnings=Coalesce(Sum("partner_earning"), 0),
            )
            .order_by("-completed_orders")[:5]
        )

        extra_context = extra_context or {}
        extra_context["dashboard_metrics"] = metrics
        extra_context["partner_performance"] = partner_performance
        return super().changelist_view(request, extra_context=extra_context)


@admin.register(TransactionLog)
class TransactionLogAdmin(AdminRoleRestrictedMixin, admin.ModelAdmin):
    list_display = (
        "order",
        "partner_earning",
        "rider_fee",
        "fualaundry_commission",
        "created_at",
    )
    list_filter = ("created_at",)
    search_fields = ("order__id", "order__partner__business_name", "order__rider__email")

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("order", "order__partner", "order__rider")


@admin.register(AdminActionLog)
class AdminActionLogAdmin(AdminRoleRestrictedMixin, admin.ModelAdmin):
    list_display = ("action", "admin_user", "order", "previous_value", "new_value", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("admin_user__email", "order__id", "previous_value", "new_value")

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("admin_user", "order")
