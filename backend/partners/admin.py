
from django.contrib import admin
from .models import LaundryPartner
from django.contrib import admin

from accounts.models import User
from .models import LaundryPartner


class AdminRoleRestrictedMixin:
    def _is_admin_role(self, request):
        return request.user.is_authenticated and request.user.is_staff and request.user.role == User.Role.ADMIN

    def has_module_permission(self, request):
        return self._is_admin_role(request)

    def has_view_permission(self, request, obj=None):
        return self._is_admin_role(request)

    def has_change_permission(self, request, obj=None):
        return self._is_admin_role(request)


@admin.register(LaundryPartner)
class LaundryPartnerAdmin(AdminRoleRestrictedMixin, admin.ModelAdmin):
    list_display = (
        "business_name",
        "owner",
        "is_approved",
        "is_active",
        "capacity_per_day",
        "commission_rate",
    )
    list_filter = ("is_approved", "is_active")
    search_fields = ("business_name", "owner__email")
    autocomplete_fields = ("owner",)
