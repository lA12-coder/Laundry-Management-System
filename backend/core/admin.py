from django.contrib import admin

from .models import SystemConfiguration


@admin.register(SystemConfiguration)
class SystemConfigurationAdmin(admin.ModelAdmin):
    list_display = (
        "rider_fee_mode",
        "rider_fee_percent",
        "rider_fee_fixed_amount",
        "updated_at",
    )

    def has_add_permission(self, request):
        return not SystemConfiguration.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
