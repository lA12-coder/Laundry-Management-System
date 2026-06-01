from django.contrib import admin

from .models import LaundryLocation, SystemConfiguration, Testimonial


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


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("customer_name", "rating", "is_approved_for_public", "created_at")
    list_filter = ("is_approved_for_public", "rating")
    search_fields = ("customer_name", "review_text")


@admin.register(LaundryLocation)
class LaundryLocationAdmin(admin.ModelAdmin):
    list_display = ("hub_name", "latitude", "longitude", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("hub_name",)
