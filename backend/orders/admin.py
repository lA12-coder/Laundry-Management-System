
from django.contrib import admin
from django.db.models import Count, Q, Sum, Value, DecimalField
from django.db.models.functions import Coalesce

from accounts.models import User
from .models import AdminActionLog, Order, TransactionLog, PriceList, ClothItem
from .services import calculate_order_price, build_cloth_items


class AdminRoleRestrictedMixin:
    def _is_admin_role(self, request):
        return request.user.is_authenticated and request.user.is_staff and request.user.role == User.Role.ADMIN

    def has_module_permission(self, request):
        return self._is_admin_role(request)

    def has_view_permission(self, request, obj=None):
        return self._is_admin_role(request)

    def has_change_permission(self, request, obj=None):
        return self._is_admin_role(request)


class ClothItemInline(admin.TabularInline):
    model = ClothItem
    extra = 1
    fields = ("price_list_entry", "quantity", "fua_price", "partner_price")
    readonly_fields = ("fua_price", "partner_price")
    autocomplete_fields = ("price_list_entry",)


@admin.register(Order)
class OrderAdmin(AdminRoleRestrictedMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "status",
        "customer",
        "partner",
        "rider",
        "total_amount",
        "created_at",
    )
    inlines = [ClothItemInline]
    fieldsets = (
        ("Order Context", {
            "fields": ("customer", "partner", "rider", "status", "urgency", "delivery_address")
        }),
        ("Financials (Calculated)", {
            "fields": ("total_amount", "base_price"),
            "description": "These fields are automatically updated based on items below."
        }),
    )
    readonly_fields = ("total_amount", "base_price")
    
    list_filter = ("status", "partner", "rider")
    search_fields = ("id", "customer__email", "partner__business_name", "rider__email")
    autocomplete_fields = ("customer", "partner", "rider")
    change_list_template = "admin/orders/order/change_list.html"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "customer", "partner", "rider", "partner__owner"
        )

    def save_formset(self, request, form, formset, change):
        """
        Recalculate order totals when inlines are saved.
        """
        # Save the inlines first (ClothItems)
        instances = formset.save(commit=False)
        for obj in formset.deleted_objects:
            obj.delete()
        
        for instance in instances:
            # Sync details from PriceList if linked
            if instance.price_list_entry:
                instance.cloth_name = instance.price_list_entry.cloth_name
                instance.size = instance.price_list_entry.size
                # Only snapshot prices if not already set manually
                if not instance.fua_price:
                    instance.fua_price = instance.price_list_entry.fua_price
                if not instance.partner_price:
                    instance.partner_price = instance.price_list_entry.partner_price
            instance.save()
        
        formset.save_m2m()
        
        # Now recalculate the Order totals based on saved items
        order = form.instance
        items = order.cloth_items.all()
        
        total = sum((item.fua_price or 0) * (item.quantity or 1) for item in items)
        base = sum((item.partner_price or 0) * (item.quantity or 1) for item in items)
        
        from decimal import Decimal
        if order.urgency == Order.Urgency.URGENT:
            total += Decimal("20.00")
            
        # Bulk update to avoid recursion in save()
        Order.objects.filter(id=order.id).update(total_amount=total, base_price=base)

    def changelist_view(self, request, extra_context=None):
        queryset = self.get_queryset(request)
        active_statuses = [Order.Status.PENDING, Order.Status.PICKED_UP, Order.Status.WASHING]

        metrics = queryset.aggregate(
            total_revenue=Coalesce(Sum("total_amount"), Value(0, output_field=DecimalField())),
            active_orders=Count("id", filter=Q(status__in=active_statuses)),
            pending_pickups=Count("id", filter=Q(status=Order.Status.PENDING)),
        )
        partner_performance = (
            queryset.values("partner__business_name")
            .annotate(
                completed_orders=Count("id", filter=Q(status=Order.Status.DELIVERED)),
                earnings=Coalesce(Sum("base_price"), Value(0, output_field=DecimalField())),
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
        "fualaundry_commission",
        "rider_fee",
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


@admin.register(PriceList)
class PriceListAdmin(AdminRoleRestrictedMixin, admin.ModelAdmin):
    list_display = ("cloth_name", "size", "fua_price", "partner_price", "is_active")
    fields = (
        "cloth_name",
        "category",
        "image",
        "size",
        "fua_price",
        "partner_price",
        "is_active",
    )
    list_filter = ("size", "is_active")
    search_fields = ("cloth_name",)
    list_editable = ("fua_price", "partner_price", "is_active")
